import { z } from "zod";
import {
  GROUP_JOIN_POLICY_VALUES,
  GROUP_JOIN_REQUEST_STATUS_VALUES,
  GROUP_PRIVACY_VALUES
} from "@/lib/groups/policies";
import { extractPlanDatePart, isPlanDateTodayOrFuture } from "@/lib/groupPlansShared";

export const PLACE_STATUS_VALUES = ["pending", "visited"] as const;
export const PLACE_SOURCE_VALUES = ["manual", "google_maps", "tiktok", "instagram", "website"] as const;
export const PLACE_PROVIDER_VALUES = ["manual", "mapbox", "google_places"] as const;
export const FRIEND_REQUEST_DECISION_VALUES = ["accepted", "rejected"] as const;
export const GOOGLE_NEARBY_RECOMMENDATION_CATEGORY_VALUES = ["popular", "food", "coffee", "plans", "sports"] as const;
export const GROUP_PLAN_VOTE_VALUES = ["attending", "maybe", "not_attending"] as const;
export const GROUP_CHAT_MESSAGE_KIND_VALUES = ["message", "plan_suggestion", "place_comment", "poll"] as const;
export const GROUP_POLL_KIND_VALUES = ["poll", "availability"] as const;
export const GROUP_POLL_TYPE_VALUES = ["place", "date", "time", "custom"] as const;
export const GROUP_AVAILABILITY_RESPONSE_VALUES = ["available", "maybe", "unavailable"] as const;
const uuidSchema = z.string().uuid("Identificador inválido.");
const nullableDateTimeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null))
  .refine((value) => value === null || !Number.isNaN(new Date(value).getTime()), "Fecha inválida.");
const nullablePlanDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null))
  .refine((value) => value === null || extractPlanDatePart(value) !== null, "Fecha inválida.")
  .refine((value) => value === null || isPlanDateTodayOrFuture(value), "La fecha del plan no puede ser anterior a hoy.");
const nullableRatingSchema = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.coerce.number().min(0, "La puntuación no es válida.").max(5, "La puntuación no es válida.").nullable()
);
const nullableRatingsTotalSchema = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.coerce.number().int("El número de reseñas no es válido.").min(0, "El número de reseñas no es válido.").nullable()
);

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del grupo es obligatorio.")
    .max(80, "El nombre del grupo no puede superar 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(300, "La descripción no puede superar 300 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  coverImageUrl: z
    .string()
    .trim()
    .max(3_000_000, "La imagen es demasiado pesada. Máximo 2 MB.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value),
      "URL de imagen inválida."
    ),
  privacy: z
    .string()
    .optional()
    .transform((value) => value || "abierto")
    .refine((value): value is (typeof GROUP_PRIVACY_VALUES)[number] => GROUP_PRIVACY_VALUES.includes(value as never), "Privacidad inválida."),
  joinPolicy: z
    .string()
    .optional()
    .transform((value) => value || "invite_only")
    .refine((value): value is (typeof GROUP_JOIN_POLICY_VALUES)[number] => {
      return GROUP_JOIN_POLICY_VALUES.includes(value as never);
    }, "Política de acceso inválida.")
});

export const joinGroupSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(1, "El código del grupo es obligatorio.")
    .max(8, "El código del grupo no es válido.")
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z0-9]{8}$/.test(value), "El código del grupo debe tener 8 caracteres alfanuméricos.")
});

export const createPlaceSchema = z.object({
  groupId: uuidSchema,
  name: z.string().trim().min(1, "El nombre del lugar es obligatorio.").max(120, "El nombre es demasiado largo."),
  address: z
    .string()
    .trim()
    .min(1, "La dirección del lugar es obligatoria.")
    .max(220, "La dirección es demasiado larga."),
  city: z
    .string()
    .trim()
    .max(120, "La ciudad es demasiado larga.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  notes: z
    .string()
    .trim()
    .max(500, "Las notas no pueden superar 500 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  category: z
    .string()
    .trim()
    .max(40, "La categoría no es válida.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  originalUrl: z
    .string()
    .trim()
    .max(500, "El enlace no puede superar 500 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value), "El enlace debe ser una URL válida."),
  source: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value): value is (typeof PLACE_SOURCE_VALUES)[number] | null => {
      return value === null || PLACE_SOURCE_VALUES.includes(value as never);
    }, "Fuente inválida."),
  provider: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value): value is (typeof PLACE_PROVIDER_VALUES)[number] | null => {
      return value === null || PLACE_PROVIDER_VALUES.includes(value as never);
    }, "Proveedor inválido."),
  externalPlaceId: z
    .string()
    .trim()
    .max(255, "Identificador externo inválido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  googleMapsUrl: z
    .string()
    .trim()
    .max(500, "El enlace de Google Maps es demasiado largo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value), "URL de Google Maps inválida."),
  businessStatus: z
    .string()
    .trim()
    .max(80, "El estado del negocio no es válido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  phoneNumber: z
    .string()
    .trim()
    .max(40, "El teléfono no es válido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  imageUrl: z
    .string()
    .trim()
    .max(1500, "La URL de imagen es demasiado larga.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^\/api\/places\/photo\?/i.test(value), "URL de imagen inválida."),
  rating: nullableRatingSchema.optional(),
  userRatingsTotal: nullableRatingsTotalSchema.optional(),
  latitude: z
    .preprocess(
      (value) => (value === "" || value === null || value === undefined ? undefined : value),
      z.coerce.number().min(-90, "La latitud no es válida.").max(90, "La latitud no es válida.")
    )
    .optional(),
  longitude: z
    .preprocess(
      (value) => (value === "" || value === null || value === undefined ? undefined : value),
      z.coerce.number().min(-180, "La longitud no es válida.").max(180, "La longitud no es válida.")
    )
    .optional()
});

export const createPersonalPlaceSchema = z.object({
  name: z.string().trim().min(1, "El nombre del lugar es obligatorio.").max(120, "El nombre es demasiado largo."),
  address: z
    .string()
    .trim()
    .min(1, "La dirección del lugar es obligatoria.")
    .max(220, "La dirección es demasiado larga."),
  city: z
    .string()
    .trim()
    .max(120, "La ciudad es demasiado larga.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  notes: z
    .string()
    .trim()
    .max(500, "Las notas no pueden superar 500 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  category: z
    .string()
    .trim()
    .max(40, "La categoría no es válida.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  source: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value): value is (typeof PLACE_SOURCE_VALUES)[number] | null => {
      return value === null || PLACE_SOURCE_VALUES.includes(value as never);
    }, "Fuente inválida."),
  provider: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value): value is (typeof PLACE_PROVIDER_VALUES)[number] | null => {
      return value === null || PLACE_PROVIDER_VALUES.includes(value as never);
    }, "Proveedor inválido."),
  externalPlaceId: z
    .string()
    .trim()
    .max(255, "Identificador externo inválido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  googleMapsUrl: z
    .string()
    .trim()
    .max(500, "El enlace de Google Maps es demasiado largo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value), "URL de Google Maps inválida."),
  businessStatus: z
    .string()
    .trim()
    .max(80, "El estado del negocio no es válido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  phoneNumber: z
    .string()
    .trim()
    .max(40, "El teléfono no es válido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  imageUrl: z
    .string()
    .trim()
    .max(1500, "La URL de imagen es demasiado larga.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^\/api\/places\/photo\?/i.test(value), "URL de imagen inválida."),
  rating: nullableRatingSchema.optional(),
  userRatingsTotal: nullableRatingsTotalSchema.optional(),
  latitude: z.coerce.number().min(-90, "La latitud no es válida.").max(90, "La latitud no es válida."),
  longitude: z.coerce.number().min(-180, "La longitud no es válida.").max(180, "La longitud no es válida.")
});

export const saveExploredPlaceSchema = createPersonalPlaceSchema.extend({
  destinationType: z
    .string()
    .refine((value): value is "personal" | "group" => value === "personal" || value === "group", "Destino inválido."),
  destinationId: z.string().trim().min(1, "El destino es obligatorio.")
});

export const updatePlaceStatusSchema = z.object({
  groupId: uuidSchema,
  placeId: uuidSchema,
  status: z
    .string()
    .refine((value): value is (typeof PLACE_STATUS_VALUES)[number] => PLACE_STATUS_VALUES.includes(value as never), {
      message: "Estado inválido."
    })
});

export const updatePlaceLocationSchema = z.object({
  groupId: uuidSchema,
  placeId: uuidSchema,
  address: z
    .string()
    .trim()
    .min(1, "La dirección del lugar es obligatoria.")
    .max(220, "La dirección es demasiado larga."),
  city: z
    .string()
    .trim()
    .max(120, "La ciudad es demasiado larga.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  latitude: z.coerce.number().min(-90, "La latitud no es válida.").max(90, "La latitud no es válida."),
  longitude: z.coerce.number().min(-180, "La longitud no es válida.").max(180, "La longitud no es válida.")
});

export const reviewJoinRequestSchema = z.object({
  groupId: uuidSchema,
  requestId: uuidSchema,
  decision: z
    .string()
    .refine((value): value is Exclude<(typeof GROUP_JOIN_REQUEST_STATUS_VALUES)[number], "pending"> => {
      return value === "approved" || value === "rejected";
    }, "Decisión inválida.")
});

export const updateGroupSettingsSchema = z.object({
  groupId: uuidSchema,
  privacy: z
    .string()
    .refine((value): value is (typeof GROUP_PRIVACY_VALUES)[number] => GROUP_PRIVACY_VALUES.includes(value as never), "Privacidad inválida."),
  joinPolicy: z
    .string()
    .refine((value): value is (typeof GROUP_JOIN_POLICY_VALUES)[number] => {
      return GROUP_JOIN_POLICY_VALUES.includes(value as never);
    }, "Política de acceso inválida.")
});

export const updateGroupDetailsSchema = z.object({
  groupId: uuidSchema,
  name: z
    .string()
    .trim()
    .min(1, "El nombre del grupo es obligatorio.")
    .max(80, "El nombre del grupo no puede superar 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(300, "La descripción no puede superar 300 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  coverImageUrl: z
    .string()
    .trim()
    .max(3_000_000, "La imagen es demasiado pesada. Máximo 2 MB.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value),
      "URL de imagen inválida."
    )
});

export const createGroupPlanSchema = z.object({
  groupId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(1, "El nombre del plan es obligatorio.")
    .max(100, "El nombre del plan no puede superar 100 caracteres."),
  description: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar 500 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  plannedDate: nullablePlanDateSchema,
  initialPlaceId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || !value || uuidSchema.safeParse(value).success, "Lugar inválido."),
  initialPlacePlannedAt: nullableDateTimeSchema,
  initialPlaceNote: z
    .string()
    .trim()
    .max(280, "La nota del lugar no puede superar 280 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
});

export const addPlaceToGroupPlanSchema = z.object({
  groupId: uuidSchema,
  planId: uuidSchema,
  placeId: uuidSchema,
  plannedAt: nullableDateTimeSchema,
  note: z
    .string()
    .trim()
    .max(280, "La nota del lugar no puede superar 280 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
});

export const voteGroupPlanSchema = z.object({
  groupId: uuidSchema,
  planId: uuidSchema,
  vote: z
    .string()
    .refine((value): value is (typeof GROUP_PLAN_VOTE_VALUES)[number] => GROUP_PLAN_VOTE_VALUES.includes(value as never), "Voto inválido.")
});

export const deleteGroupPlanSchema = z.object({
  groupId: uuidSchema,
  planId: uuidSchema
});

export const updateGroupPlanDateSchema = z.object({
  groupId: uuidSchema,
  planId: uuidSchema,
  plannedDate: nullablePlanDateSchema
});

export const updateGroupPlanDetailsSchema = z.object({
  groupId: uuidSchema,
  planId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(1, "El nombre del plan es obligatorio.")
    .max(100, "El nombre del plan no puede superar 100 caracteres."),
  plannedDate: nullablePlanDateSchema
});

export const removeGroupPlanPlaceSchema = z.object({
  groupId: uuidSchema,
  planId: uuidSchema,
  planPlaceId: uuidSchema
});

export const updateGroupPlanPlaceTimeSchema = z.object({
  groupId: uuidSchema,
  planId: uuidSchema,
  planPlaceId: uuidSchema,
  plannedAt: nullableDateTimeSchema
});

export const reorderGroupPlanPlacesSchema = z.object({
  groupId: uuidSchema,
  planId: uuidSchema,
  orderedPlanPlaceIds: z.array(uuidSchema).min(1, "Orden inválido.")
});

const legacyGroupPollOptionSchema = z.object({
  label: z.string().trim().min(1, "Cada opción necesita un nombre.").max(120, "La opción es demasiado larga."),
  placeId: z.string().uuid("Lugar inválido.").nullable().optional(),
  optionDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")
    .nullable()
    .optional(),
  startTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Hora inválida.")
    .nullable()
    .optional(),
  endTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Hora final inválida.")
    .nullable()
    .optional()
}).superRefine((option, context) => {
  if (option.startTime && option.endTime && option.endTime <= option.startTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La hora final debe ser posterior a la inicial.",
      path: ["endTime"]
    });
  }
});

const groupPollOptionSchema = legacyGroupPollOptionSchema;

const _legacyCreateGroupPollSchema = z
  .object({
    groupId: uuidSchema,
    title: z.string().trim().min(1, "La pregunta es obligatoria.").max(140, "La pregunta es demasiado larga."),
    kind: z.string().refine(
      (value): value is (typeof GROUP_POLL_KIND_VALUES)[number] => GROUP_POLL_KIND_VALUES.includes(value as never),
      "Tipo de decisión inválido."
    ),
    pollType: z.string().refine(
      (value): value is (typeof GROUP_POLL_TYPE_VALUES)[number] => GROUP_POLL_TYPE_VALUES.includes(value as never),
      "Tipo de encuesta inválido."
    ),
    planId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null))
      .refine((value) => value === null || uuidSchema.safeParse(value).success, "Plan inválido."),
    closesAt: nullableDateTimeSchema,
    options: z.array(groupPollOptionSchema).min(2, "Añade al menos dos opciones.").max(12, "Puedes añadir hasta 12 opciones.")
  })
  .superRefine((input, context) => {
    if (input.kind === "availability" && input.pollType !== "date") {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "La disponibilidad debe usar propuestas de fecha.", path: ["pollType"] });
    }

    const normalizedLabels = input.options.map((option) => option.label.trim().toLocaleLowerCase("es"));
    if (new Set(normalizedLabels).size !== normalizedLabels.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "No puede haber opciones duplicadas.", path: ["options"] });
    }

    input.options.forEach((option, index) => {
      if ((input.kind === "availability" || input.pollType === "date") && !option.optionDate) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Selecciona una fecha.", path: ["options", index, "optionDate"] });
      }
      if (input.pollType === "time" && !option.startTime) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Selecciona una hora.", path: ["options", index, "startTime"] });
      }
      if (input.pollType === "place" && !option.placeId) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Selecciona un lugar.", path: ["options", index, "placeId"] });
      }
    });
  });

const placePollOptionSchema = z.object({
  label: z.string().trim().min(1, "Cada opción necesita un nombre.").max(120, "La opción es demasiado larga."),
  placeId: uuidSchema
});

export const createGroupPollSchema = z
  .object({
    groupId: uuidSchema,
    title: z.string().trim().min(1, "La pregunta es obligatoria.").max(140, "La pregunta es demasiado larga."),
    kind: z.literal("poll", { message: "Las encuestas solo pueden ser de lugares." }),
    pollType: z.literal("place", { message: "Las encuestas solo pueden ser de lugares." }),
    planId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null))
      .refine((value) => value === null || uuidSchema.safeParse(value).success, "Plan inválido."),
    closesAt: nullableDateTimeSchema,
    options: z.array(placePollOptionSchema).min(2, "Añade al menos dos lugares.").max(12, "Puedes añadir hasta 12 lugares.")
  })
  .superRefine((input, context) => {
    const placeIds = input.options.map((option) => option.placeId);
    if (new Set(placeIds).size !== placeIds.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "No puede haber lugares duplicados.", path: ["options"] });
    }
  });

export const voteGroupPollSchema = z.object({
  groupId: uuidSchema,
  pollId: uuidSchema,
  optionId: uuidSchema
});

export const respondGroupAvailabilitySchema = z.object({
  groupId: uuidSchema,
  pollId: uuidSchema,
  optionId: uuidSchema,
  response: z.string().refine(
    (value): value is (typeof GROUP_AVAILABILITY_RESPONSE_VALUES)[number] =>
      GROUP_AVAILABILITY_RESPONSE_VALUES.includes(value as never),
    "Respuesta de disponibilidad inválida."
  )
});

export const closeGroupPollSchema = z.object({
  groupId: uuidSchema,
  pollId: uuidSchema
});

export const deleteGroupPollSchema = z.object({
  groupId: uuidSchema,
  pollId: uuidSchema
});

export const convertGroupPollToPlanSchema = z.object({
  groupId: uuidSchema,
  pollId: uuidSchema,
  title: z.string().trim().min(1, "El nombre del plan es obligatorio.").max(100, "El nombre del plan es demasiado largo.")
});

const optionalUuidField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null))
  .refine((value) => value === null || uuidSchema.safeParse(value).success, "Identificador inválido.");

export const createGroupChatMessageSchema = z.object({
  groupId: uuidSchema,
  content: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje.")
    .max(1000, "El mensaje no puede superar 1000 caracteres."),
  kind: z
    .string()
    .optional()
    .transform((value) => value || "message")
    .refine(
      (value): value is (typeof GROUP_CHAT_MESSAGE_KIND_VALUES)[number] => GROUP_CHAT_MESSAGE_KIND_VALUES.includes(value as never),
      "Tipo de mensaje inválido."
    ),
  planId: optionalUuidField,
  pollId: optionalUuidField,
  placeId: optionalUuidField,
  planPlaceId: optionalUuidField
});

export const deleteGroupChatMessageSchema = z.object({
  groupId: uuidSchema,
  messageId: uuidSchema
});

export const removeGroupMemberSchema = z.object({
  groupId: uuidSchema,
  memberUserId: uuidSchema
});

export const sendFriendRequestSchema = z.object({
  receiverId: uuidSchema
});

export const respondFriendRequestSchema = z.object({
  requestId: uuidSchema,
  decision: z
    .string()
    .refine((value): value is (typeof FRIEND_REQUEST_DECISION_VALUES)[number] => {
      return FRIEND_REQUEST_DECISION_VALUES.includes(value as never);
    }, "Decisión inválida.")
});

export const removeFriendSchema = z.object({
  friendUserId: uuidSchema
});

export const inviteFriendToGroupSchema = z.object({
  groupId: uuidSchema,
  friendUserId: uuidSchema
});

export const respondGroupInvitationSchema = z.object({
  invitationId: uuidSchema,
  decision: z
    .string()
    .refine((value): value is (typeof FRIEND_REQUEST_DECISION_VALUES)[number] => {
      return FRIEND_REQUEST_DECISION_VALUES.includes(value as never);
    }, "Decisión inválida.")
});

export const friendSearchQuerySchema = z.object({
  q: z.string().trim().min(2, "La búsqueda debe tener al menos 2 caracteres.").max(80, "La búsqueda es demasiado larga.")
});

export const googlePlacesSearchSchema = z.object({
  query: z.string().trim().min(3, "La búsqueda debe tener al menos 3 caracteres.").max(120, "La búsqueda es demasiado larga."),
  center: z
    .object({
      lat: z.coerce.number().min(-90, "La latitud no es válida.").max(90, "La latitud no es válida."),
      lng: z.coerce.number().min(-180, "La longitud no es válida.").max(180, "La longitud no es válida.")
    })
    .nullable()
    .optional()
});

export const googlePlaceDetailsSchema = z.object({
  externalPlaceId: z
    .string()
    .trim()
    .min(1, "Identificador externo obligatorio.")
    .max(255, "Identificador externo inválido.")
});

export const updatePlaceFavoriteSchema = z.object({
  groupId: uuidSchema,
  placeId: uuidSchema,
  isFavorite: z
    .string()
    .refine((value): value is "true" | "false" => value === "true" || value === "false", {
      message: "Favorito inválido."
    })
    .transform((value) => value === "true")
});

export const updatePersonalPlaceStatusSchema = z.object({
  placeId: uuidSchema,
  status: z
    .string()
    .refine((value): value is (typeof PLACE_STATUS_VALUES)[number] => PLACE_STATUS_VALUES.includes(value as never), {
      message: "Estado inválido."
    })
});

export const updatePersonalPlaceFavoriteSchema = z.object({
  placeId: uuidSchema,
  isFavorite: z
    .string()
    .refine((value): value is "true" | "false" => value === "true" || value === "false", {
      message: "Favorito inválido."
    })
    .transform((value) => value === "true")
});

export const googlePlacesNearbySchema = z.object({
  lat: z.coerce.number().min(-90, "La latitud no es válida.").max(90, "La latitud no es válida."),
  lng: z.coerce.number().min(-180, "La longitud no es válida.").max(180, "La longitud no es válida."),
  selectedName: z
    .string()
    .trim()
    .max(120, "El nombre seleccionado es demasiado largo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
});

export const googlePlacesNearbyRecommendationsSchema = z.object({
  lat: z.coerce.number().min(-90, "La latitud no es válida.").max(90, "La latitud no es válida."),
  lng: z.coerce.number().min(-180, "La longitud no es válida.").max(180, "La longitud no es válida."),
  category: z
    .string()
    .optional()
    .transform((value) => value || "popular")
    .refine(
      (value): value is (typeof GOOGLE_NEARBY_RECOMMENDATION_CATEGORY_VALUES)[number] =>
        GOOGLE_NEARBY_RECOMMENDATION_CATEGORY_VALUES.includes(value as never),
      "Categoría inválida."
    ),
  radius: z.coerce.number().int().min(300, "Radio inválido.").max(5000, "Radio inválido.").optional().default(1800)
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(80, "El nombre no puede superar 80 caracteres."),
  username: z
    .string()
    .trim()
    .min(3, "El @usuario debe tener al menos 3 caracteres.")
    .max(30, "El @usuario no puede superar 30 caracteres.")
    .regex(/^[a-z0-9_.-]+$/i, "El @usuario solo puede contener letras, números, punto, guion y guion bajo."),
  avatarUrl: z
    .string()
    .trim()
    .max(3_000_000, "La imagen es demasiado pesada. Máximo 2 MB.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value),
      "URL de imagen inválida."
    )
});

export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "ELIMINAR", "Escribe ELIMINAR para confirmar.")
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;
export type CreatePersonalPlaceInput = z.infer<typeof createPersonalPlaceSchema>;
export type SaveExploredPlaceInput = z.infer<typeof saveExploredPlaceSchema>;
export type UpdatePlaceStatusInput = z.infer<typeof updatePlaceStatusSchema>;
export type UpdatePlaceFavoriteInput = z.infer<typeof updatePlaceFavoriteSchema>;
export type UpdatePersonalPlaceStatusInput = z.infer<typeof updatePersonalPlaceStatusSchema>;
export type UpdatePersonalPlaceFavoriteInput = z.infer<typeof updatePersonalPlaceFavoriteSchema>;
export type UpdatePlaceLocationInput = z.infer<typeof updatePlaceLocationSchema>;
export type ReviewJoinRequestInput = z.infer<typeof reviewJoinRequestSchema>;
export type UpdateGroupSettingsInput = z.infer<typeof updateGroupSettingsSchema>;
export type UpdateGroupDetailsInput = z.infer<typeof updateGroupDetailsSchema>;
export type CreateGroupPlanInput = z.infer<typeof createGroupPlanSchema>;
export type AddPlaceToGroupPlanInput = z.infer<typeof addPlaceToGroupPlanSchema>;
export type VoteGroupPlanInput = z.infer<typeof voteGroupPlanSchema>;
export type DeleteGroupPlanInput = z.infer<typeof deleteGroupPlanSchema>;
export type UpdateGroupPlanDateInput = z.infer<typeof updateGroupPlanDateSchema>;
export type UpdateGroupPlanDetailsInput = z.infer<typeof updateGroupPlanDetailsSchema>;
export type RemoveGroupPlanPlaceInput = z.infer<typeof removeGroupPlanPlaceSchema>;
export type UpdateGroupPlanPlaceTimeInput = z.infer<typeof updateGroupPlanPlaceTimeSchema>;
export type ReorderGroupPlanPlacesInput = z.infer<typeof reorderGroupPlanPlacesSchema>;
export type CreateGroupPollInput = z.infer<typeof createGroupPollSchema>;
export type VoteGroupPollInput = z.infer<typeof voteGroupPollSchema>;
export type RespondGroupAvailabilityInput = z.infer<typeof respondGroupAvailabilitySchema>;
export type CloseGroupPollInput = z.infer<typeof closeGroupPollSchema>;
export type DeleteGroupPollInput = z.infer<typeof deleteGroupPollSchema>;
export type ConvertGroupPollToPlanInput = z.infer<typeof convertGroupPollToPlanSchema>;
export type CreateGroupChatMessageInput = z.infer<typeof createGroupChatMessageSchema>;
export type DeleteGroupChatMessageInput = z.infer<typeof deleteGroupChatMessageSchema>;
export type RemoveGroupMemberInput = z.infer<typeof removeGroupMemberSchema>;
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<typeof respondFriendRequestSchema>;
export type RemoveFriendInput = z.infer<typeof removeFriendSchema>;
export type InviteFriendToGroupInput = z.infer<typeof inviteFriendToGroupSchema>;
export type RespondGroupInvitationInput = z.infer<typeof respondGroupInvitationSchema>;
export type FriendSearchQueryInput = z.infer<typeof friendSearchQuerySchema>;
export type GooglePlacesSearchInput = z.infer<typeof googlePlacesSearchSchema>;
export type GooglePlaceDetailsInput = z.infer<typeof googlePlaceDetailsSchema>;
export type GooglePlacesNearbyInput = z.infer<typeof googlePlacesNearbySchema>;
export type GooglePlacesNearbyRecommendationsInput = z.infer<typeof googlePlacesNearbyRecommendationsSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
