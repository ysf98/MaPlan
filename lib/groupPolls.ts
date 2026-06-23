import { canEditPlaces, isGroupMember, isGroupOwner } from "@/lib/groupPermissions";
import {
  recordPollClosedGroupActivity,
  recordPollConvertedGroupActivity,
  recordPollCreatedGroupActivity
} from "@/lib/groupActivity";
import { createGroupPlan } from "@/lib/groupPlans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  GroupAvailabilityResponse,
  GroupPollKind,
  GroupPollStatus,
  GroupPollType
} from "@/types/supabase";

export type GroupPollOptionInput = {
  label: string;
  placeId: string;
};

type CreateGroupPollInput = {
  userId: string;
  groupId: string;
  title: string;
  kind: GroupPollKind;
  pollType: GroupPollType;
  planId?: string | null;
  closesAt?: string | null;
  options: GroupPollOptionInput[];
};

type PollRow = {
  id: string;
  group_id: string;
  created_by: string;
  plan_id: string | null;
  converted_plan_id: string | null;
  title: string;
  kind: string;
  poll_type: string;
  status: string;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
};

type PollOptionRow = {
  id: string;
  poll_id: string;
  label: string;
  place_id: string | null;
  option_date: string | null;
  start_time: string | null;
  end_time: string | null;
  position: number;
};

type PollVoteRow = {
  poll_id: string;
  option_id: string;
  user_id: string;
};

type PollPlaceRow = {
  address: string | null;
  city: string | null;
  id: string;
  image_url: string | null;
  name: string;
};

export type GroupPollOptionItem = {
  id: string;
  label: string;
  placeId: string | null;
  placeAddress: string | null;
  placeCity: string | null;
  placeImageUrl: string | null;
  placeName: string | null;
  optionDate: string | null;
  startTime: string | null;
  endTime: string | null;
  position: number;
  voteCount: number;
  isCurrentUserVote: boolean;
  isWinner: boolean;
};

export type GroupPollItem = {
  id: string;
  groupId: string;
  createdBy: string;
  planId: string | null;
  convertedPlanId: string | null;
  title: string;
  kind: GroupPollKind;
  pollType: GroupPollType;
  status: GroupPollStatus;
  closesAt: string | null;
  createdAt: string;
  updatedAt: string;
  options: GroupPollOptionItem[];
  totalResponses: number;
  hasTie: boolean;
  canClose: boolean;
  canConvert: boolean;
};

export type PollRankingInput = {
  id: string;
  voteCount: number;
  availableCount?: number;
  maybeCount?: number;
};

export function getWinningOptionIds(_kind: GroupPollKind, options: PollRankingInput[]): string[] {
  if (options.length === 0) {
    return [];
  }

  const bestVoteCount = Math.max(...options.map((option) => option.voteCount));
  if (bestVoteCount <= 0) {
    return [];
  }
  return options.filter((option) => option.voteCount === bestVoteCount).map((option) => option.id);
}

function isPollKind(value: string): value is GroupPollKind {
  return value === "poll" || value === "availability";
}

function isPollType(value: string): value is GroupPollType {
  return value === "place" || value === "date" || value === "time" || value === "custom";
}

function isPollStatus(value: string): value is GroupPollStatus {
  return value === "open" || value === "closed";
}

async function getPollRow(groupId: string, pollId: string): Promise<PollRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_polls")
    .select("id, group_id, created_by, plan_id, converted_plan_id, title, kind, poll_type, status, closes_at, created_at, updated_at")
    .eq("group_id", groupId)
    .eq("id", pollId)
    .maybeSingle();

  return error || !data ? null : (data as PollRow);
}

async function validatePollReferences(input: CreateGroupPollInput): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  if (input.kind !== "poll" || input.pollType !== "place") {
    return "Las encuestas solo pueden ser de lugares guardados del grupo.";
  }

  if (input.planId) {
    const { data } = await supabase
      .from("group_plans")
      .select("id")
      .eq("id", input.planId)
      .eq("group_id", input.groupId)
      .maybeSingle();
    if (!data) {
      return "El plan asociado no pertenece al grupo.";
    }
  }

  const placeIds = input.options.map((option) => option.placeId);
  if (new Set(placeIds).size !== placeIds.length) {
    return "No puede haber lugares duplicados en la encuesta.";
  }

  const { data } = await supabase.from("places").select("id").eq("group_id", input.groupId).in("id", placeIds);
  if ((data || []).length !== placeIds.length) {
    return "Alguno de los lugares no pertenece al grupo.";
  }

  return null;
}

export async function getGroupPollsForUser(userId: string, groupId: string): Promise<GroupPollItem[]> {
  if (!(await isGroupMember(userId, groupId))) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const pollsResult = await supabase
    .from("group_polls")
    .select("id, group_id, created_by, plan_id, converted_plan_id, title, kind, poll_type, status, closes_at, created_at, updated_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  const rows = (pollsResult.data || []) as PollRow[];
  const visibleRows = rows.filter((poll) => poll.kind === "poll" && poll.poll_type === "place");
  if (visibleRows.length === 0) {
    return [];
  }

  const pollIds = visibleRows.map((poll) => poll.id);
  const [optionsResult, votesResult, isOwner, canCreatePlans] = await Promise.all([
    supabase
      .from("group_poll_options")
      .select("id, poll_id, label, place_id, option_date, start_time, end_time, position")
      .in("poll_id", pollIds)
      .order("position", { ascending: true }),
    supabase.from("group_poll_votes").select("poll_id, option_id, user_id").in("poll_id", pollIds),
    isGroupOwner(userId, groupId),
    canEditPlaces(userId, groupId)
  ]);

  const optionRows = (optionsResult.data || []) as PollOptionRow[];
  const voteRows = (votesResult.data || []) as PollVoteRow[];
  const placeIds = Array.from(new Set(optionRows.map((option) => option.place_id).filter(Boolean) as string[]));
  const placesResult = placeIds.length
    ? await supabase.from("places").select("id, name, address, city, image_url").eq("group_id", groupId).in("id", placeIds)
    : { data: [] as PollPlaceRow[] };
  const placeById = new Map(((placesResult.data || []) as PollPlaceRow[]).map((place) => [place.id, place]));

  return visibleRows.flatMap((poll) => {
    if (!isPollKind(poll.kind) || !isPollType(poll.poll_type) || !isPollStatus(poll.status)) {
      return [];
    }

    const pollOptions = optionRows.filter((option) => option.poll_id === poll.id);
    const pollVotes = voteRows.filter((vote) => vote.poll_id === poll.id);
    const ranking = pollOptions.map((option) => ({
      id: option.id,
      voteCount: pollVotes.filter((vote) => vote.option_id === option.id).length
    }));
    const winningIds = getWinningOptionIds(poll.kind, ranking);
    const uniqueResponders = new Set(pollVotes.map((vote) => vote.user_id)).size;

    return [{
      id: poll.id,
      groupId: poll.group_id,
      createdBy: poll.created_by,
      planId: poll.plan_id,
      convertedPlanId: poll.converted_plan_id,
      title: poll.title,
      kind: poll.kind,
      pollType: poll.poll_type,
      status: poll.status,
      closesAt: poll.closes_at,
      createdAt: poll.created_at,
      updatedAt: poll.updated_at,
      totalResponses: uniqueResponders,
      hasTie: winningIds.length > 1,
      canClose: poll.status === "open" && (isOwner || poll.created_by === userId),
      canConvert:
        poll.status === "closed" &&
        poll.converted_plan_id === null &&
        winningIds.length === 1 &&
        canCreatePlans,
      options: pollOptions.map((option) => {
        const place = option.place_id ? placeById.get(option.place_id) : null;
        return {
          id: option.id,
          label: option.label,
          placeId: option.place_id,
          placeAddress: place?.address ?? null,
          placeCity: place?.city ?? null,
          placeImageUrl: place?.image_url ?? null,
          placeName: place?.name ?? null,
          optionDate: option.option_date,
          startTime: option.start_time,
          endTime: option.end_time,
          position: option.position,
          voteCount: pollVotes.filter((vote) => vote.option_id === option.id).length,
          isCurrentUserVote: pollVotes.some((vote) => vote.option_id === option.id && vote.user_id === userId),
          isWinner: winningIds.includes(option.id)
        };
      })
    }];
  });
}

export async function createGroupPoll(input: CreateGroupPollInput): Promise<{ error: string | null; pollId: string | null }> {
  if (!(await canEditPlaces(input.userId, input.groupId))) {
    return { error: "No tienes permisos para crear decisiones en este grupo.", pollId: null };
  }

  const referenceError = await validatePollReferences(input);
  if (referenceError) {
    return { error: referenceError, pollId: null };
  }

  const supabase = await createSupabaseServerClient();
  const pollResult = await supabase
    .from("group_polls")
    .insert({
      group_id: input.groupId,
      created_by: input.userId,
      plan_id: input.planId ?? null,
      title: input.title.trim(),
      kind: "poll",
      poll_type: "place",
      closes_at: input.closesAt ?? null
    })
    .select("id")
    .maybeSingle();

  if (pollResult.error || !pollResult.data) {
    return { error: pollResult.error?.message ?? "No se pudo crear la encuesta.", pollId: null };
  }
  const pollId = pollResult.data.id;

  const optionsResult = await supabase.from("group_poll_options").insert(
    input.options.map((option, position) => ({
      poll_id: pollId,
      label: option.label.trim(),
      place_id: option.placeId,
      option_date: null,
      start_time: null,
      end_time: null,
      position
    }))
  );

  if (optionsResult.error) {
    await supabase.from("group_polls").delete().eq("id", pollId);
    return { error: optionsResult.error.message, pollId: null };
  }

  await recordPollCreatedGroupActivity({
    actorUserId: input.userId,
    groupId: input.groupId,
    pollId,
    pollTitle: input.title
  });
  return { error: null, pollId };
}

export async function voteGroupPoll(input: {
  userId: string;
  groupId: string;
  pollId: string;
  optionId: string;
}): Promise<{ error: string | null }> {
  if (!(await isGroupMember(input.userId, input.groupId))) {
    return { error: "No tienes permisos para votar en esta encuesta." };
  }
  const poll = await getPollRow(input.groupId, input.pollId);
  if (!poll || poll.kind !== "poll" || poll.status !== "open") {
    return { error: "La encuesta no está disponible para votar." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: option } = await supabase
    .from("group_poll_options")
    .select("id")
    .eq("id", input.optionId)
    .eq("poll_id", input.pollId)
    .maybeSingle();
  if (!option) {
    return { error: "La opción seleccionada no pertenece a esta encuesta." };
  }

  const { error } = await supabase.from("group_poll_votes").upsert(
    {
      poll_id: input.pollId,
      option_id: input.optionId,
      user_id: input.userId
    },
    { onConflict: "poll_id,user_id" }
  );
  return { error: error?.message ?? null };
}

export async function respondGroupAvailability(input: {
  userId: string;
  groupId: string;
  pollId: string;
  optionId: string;
  response: GroupAvailabilityResponse;
}): Promise<{ error: string | null }> {
  if (!(await isGroupMember(input.userId, input.groupId))) {
    return { error: "No tienes permisos para responder a esta disponibilidad." };
  }
  const poll = await getPollRow(input.groupId, input.pollId);
  if (!poll || poll.kind !== "availability" || poll.status !== "open") {
    return { error: "La consulta de disponibilidad está cerrada." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: option } = await supabase
    .from("group_poll_options")
    .select("id")
    .eq("id", input.optionId)
    .eq("poll_id", input.pollId)
    .maybeSingle();
  if (!option) {
    return { error: "La franja seleccionada no pertenece a esta consulta." };
  }

  const { error } = await supabase.from("group_availability_responses").upsert(
    {
      poll_id: input.pollId,
      option_id: input.optionId,
      user_id: input.userId,
      response: input.response
    },
    { onConflict: "option_id,user_id" }
  );
  return { error: error?.message ?? null };
}

export async function closeGroupPoll(input: {
  userId: string;
  groupId: string;
  pollId: string;
}): Promise<{ error: string | null }> {
  const poll = await getPollRow(input.groupId, input.pollId);
  if (!poll) {
    return { error: "No se encontró la encuesta." };
  }
  const canClose = poll.created_by === input.userId || (await isGroupOwner(input.userId, input.groupId));
  if (!canClose) {
    return { error: "No tienes permisos para cerrar esta encuesta." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_polls")
    .update({ status: "closed" })
    .eq("id", input.pollId)
    .eq("group_id", input.groupId)
    .eq("status", "open")
    .select("id")
    .maybeSingle();
  if (!error && data) {
    await recordPollClosedGroupActivity({
      actorUserId: input.userId,
      groupId: input.groupId,
      pollId: poll.id,
      pollTitle: poll.title
    });
  }
  if (!error && !data) {
    return { error: "La encuesta ya estaba cerrada." };
  }
  return { error: error?.message ?? null };
}

export async function convertGroupPollToPlan(input: {
  userId: string;
  groupId: string;
  pollId: string;
  title: string;
}): Promise<{ error: string | null; planId: string | null }> {
  if (!(await canEditPlaces(input.userId, input.groupId))) {
    return { error: "No tienes permisos para crear planes en este grupo.", planId: null };
  }
  const polls = await getGroupPollsForUser(input.userId, input.groupId);
  const poll = polls.find((candidate) => candidate.id === input.pollId);
  if (!poll || poll.status !== "closed") {
    return { error: "Cierra la encuesta antes de convertirla en plan.", planId: null };
  }
  if (poll.convertedPlanId) {
    return { error: "Esta encuesta ya se convirtió en un plan.", planId: poll.convertedPlanId };
  }

  const winners = poll.options.filter((option) => option.isWinner);
  if (winners.length !== 1) {
    return { error: winners.length === 0 ? "La encuesta todavía no tiene un resultado." : "Hay un empate que debes resolver antes.", planId: null };
  }
  const winner = winners[0];
  const planResult = await createGroupPlan({
    userId: input.userId,
    groupId: input.groupId,
    title: input.title,
    description: null,
    plannedDate: null,
    initialPlaceId: winner.placeId
  });
  if (planResult.error || !planResult.planId) {
    return planResult;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("group_polls")
    .update({ converted_plan_id: planResult.planId })
    .eq("id", poll.id)
    .eq("group_id", input.groupId)
    .is("converted_plan_id", null);

  if (error) {
    return { error: "El plan se creó, pero no se pudo enlazar con la encuesta.", planId: planResult.planId };
  }
  await recordPollConvertedGroupActivity({
    actorUserId: input.userId,
    groupId: input.groupId,
    pollId: poll.id,
    pollTitle: poll.title
  });
  return { error: null, planId: planResult.planId };
}
