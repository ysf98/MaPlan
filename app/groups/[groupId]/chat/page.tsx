import { notFound, redirect } from "next/navigation";
import { GroupChatView } from "@/components/groups/GroupChatView";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getGroupChatMessagesForUser, markGroupChatAsReadForUser } from "@/lib/groupChat";
import { getGroupDetailForUser } from "@/lib/groups";

type GroupChatPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupChatPage({ params }: GroupChatPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  const { groupId } = await params;
  const [group, messages] = await Promise.all([getGroupDetailForUser(user.id, groupId), getGroupChatMessagesForUser(user.id, groupId)]);

  if (!group) {
    notFound();
  }

  await markGroupChatAsReadForUser({
    groupId,
    lastReadAt: messages.at(-1)?.createdAt ?? null,
    userId: user.id
  });

  return (
    <AppShell currentUser={user} fullBleed>
      <GroupChatView currentUserId={user.id} groupId={groupId} groupName={group.name} messages={messages} />
    </AppShell>
  );
}
