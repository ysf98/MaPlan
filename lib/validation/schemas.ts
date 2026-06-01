import { z } from "zod";
import {
  GROUP_JOIN_POLICY_VALUES,
  GROUP_JOIN_REQUEST_STATUS_VALUES,
  GROUP_PRIVACY_VALUES
} from "@/lib/groups/policies";

export const PLACE_STATUS_VALUES = ["pending", "visited"] as const;
export const PLACE_SOURCE_VALUES = ["manual", "google_maps", "tiktok", "instagram", "website"] as const;
export const PLACE_PROVIDER_VALUES = ["manual", "mapbox", "google_places"] as const;
export const FRIEND_REQUEST_DECISION_VALUES = ["accepted", "rejected"] as const;
const uuidSchema = z.string().uuid("Identificador invalido.");

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del grupo es obligatorio.")
    .max(80, "El nombre del grupo no puede superar 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(300, "La descripcion no puede superar 300 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  coverImageUrl: z
    .string()
    .trim()
    .max(3_000_000, "La imagen es demasiado pesada. Maximo 2MB.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value),
      "URL de imagen invalida."
    ),
  privacy: z
    .string()
    .optional()
    .transform((value) => value || "abierto")
    .refine((value): value is (typeof GROUP_PRIVACY_VALUES)[number] => GROUP_PRIVACY_VALUES.includes(value as never), "Privacidad invalida."),
  joinPolicy: z
    .string()
    .optional()
    .transform((value) => value || "invite_only")
    .refine((value): value is (typeof GROUP_JOIN_POLICY_VALUES)[number] => {
      return GROUP_JOIN_POLICY_VALUES.includes(value as never);
    }, "Politica de acceso invalida.")
});

export const joinGroupSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(1, "El codigo del grupo es obligatorio.")
    .max(8, "El codigo del grupo no es valido.")
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z0-9]{8}$/.test(value), "El codigo del grupo debe tener 8 caracteres alfanumericos.")
});

export const createPlaceSchema = z.object({
  groupId: uuidSchema,
  name: z.string().trim().min(1, "El nombre del lugar es obligatorio.").max(120, "El nombre es demasiado largo."),
  address: z
    .string()
    .trim()
    .min(1, "La direccion del lugar es obligatoria.")
    .max(220, "La direccion es demasiado larga."),
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
    .max(40, "La categoria no es valida.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  originalUrl: z
    .string()
    .trim()
    .max(500, "El enlace no puede superar 500 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value), "El enlace debe ser una URL valida."),
  source: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value): value is (typeof PLACE_SOURCE_VALUES)[number] | null => {
      return value === null || PLACE_SOURCE_VALUES.includes(value as never);
    }, "Fuente invalida."),
  provider: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value): value is (typeof PLACE_PROVIDER_VALUES)[number] | null => {
      return value === null || PLACE_PROVIDER_VALUES.includes(value as never);
    }, "Proveedor invalido."),
  externalPlaceId: z
    .string()
    .trim()
    .max(255, "Identificador externo invalido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  googleMapsUrl: z
    .string()
    .trim()
    .max(500, "El enlace de Google Maps es demasiado largo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value), "URL de Google Maps invalida."),
  businessStatus: z
    .string()
    .trim()
    .max(80, "El estado del negocio no es valido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  imageUrl: z
    .string()
    .trim()
    .max(1500, "La URL de imagen es demasiado larga.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^\/api\/places\/photo\?/i.test(value), "URL de imagen invalida."),
  isFavorite: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  latitude: z
    .preprocess(
      (value) => (value === "" || value === null || value === undefined ? undefined : value),
      z.coerce.number().min(-90, "La latitud no es valida.").max(90, "La latitud no es valida.")
    )
    .optional(),
  longitude: z
    .preprocess(
      (value) => (value === "" || value === null || value === undefined ? undefined : value),
      z.coerce.number().min(-180, "La longitud no es valida.").max(180, "La longitud no es valida.")
    )
    .optional()
});

export const createPersonalPlaceSchema = z.object({
  name: z.string().trim().min(1, "El nombre del lugar es obligatorio.").max(120, "El nombre es demasiado largo."),
  address: z
    .string()
    .trim()
    .min(1, "La direccion del lugar es obligatoria.")
    .max(220, "La direccion es demasiado larga."),
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
    .max(40, "La categoria no es valida.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  source: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value): value is (typeof PLACE_SOURCE_VALUES)[number] | null => {
      return value === null || PLACE_SOURCE_VALUES.includes(value as never);
    }, "Fuente invalida."),
  provider: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value): value is (typeof PLACE_PROVIDER_VALUES)[number] | null => {
      return value === null || PLACE_PROVIDER_VALUES.includes(value as never);
    }, "Proveedor invalido."),
  externalPlaceId: z
    .string()
    .trim()
    .max(255, "Identificador externo invalido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  googleMapsUrl: z
    .string()
    .trim()
    .max(500, "El enlace de Google Maps es demasiado largo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value), "URL de Google Maps invalida."),
  businessStatus: z
    .string()
    .trim()
    .max(80, "El estado del negocio no es valido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  imageUrl: z
    .string()
    .trim()
    .max(1500, "La URL de imagen es demasiado larga.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^\/api\/places\/photo\?/i.test(value), "URL de imagen invalida."),
  latitude: z.coerce.number().min(-90, "La latitud no es valida.").max(90, "La latitud no es valida."),
  longitude: z.coerce.number().min(-180, "La longitud no es valida.").max(180, "La longitud no es valida.")
});

export const updatePlaceStatusSchema = z.object({
  groupId: uuidSchema,
  placeId: uuidSchema,
  status: z
    .string()
    .refine((value): value is (typeof PLACE_STATUS_VALUES)[number] => PLACE_STATUS_VALUES.includes(value as never), {
      message: "Estado invalido."
    })
});

export const updatePlaceLocationSchema = z.object({
  groupId: uuidSchema,
  placeId: uuidSchema,
  address: z
    .string()
    .trim()
    .min(1, "La direccion del lugar es obligatoria.")
    .max(220, "La direccion es demasiado larga."),
  city: z
    .string()
    .trim()
    .max(120, "La ciudad es demasiado larga.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  latitude: z.coerce.number().min(-90, "La latitud no es valida.").max(90, "La latitud no es valida."),
  longitude: z.coerce.number().min(-180, "La longitud no es valida.").max(180, "La longitud no es valida.")
});

export const reviewJoinRequestSchema = z.object({
  groupId: uuidSchema,
  requestId: uuidSchema,
  decision: z
    .string()
    .refine((value): value is Exclude<(typeof GROUP_JOIN_REQUEST_STATUS_VALUES)[number], "pending"> => {
      return value === "approved" || value === "rejected";
    }, "Decision invalida.")
});

export const updateGroupSettingsSchema = z.object({
  groupId: uuidSchema,
  privacy: z
    .string()
    .refine((value): value is (typeof GROUP_PRIVACY_VALUES)[number] => GROUP_PRIVACY_VALUES.includes(value as never), "Privacidad invalida."),
  joinPolicy: z
    .string()
    .refine((value): value is (typeof GROUP_JOIN_POLICY_VALUES)[number] => {
      return GROUP_JOIN_POLICY_VALUES.includes(value as never);
    }, "Politica de acceso invalida.")
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
    .max(300, "La descripcion no puede superar 300 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  coverImageUrl: z
    .string()
    .trim()
    .max(3_000_000, "La imagen es demasiado pesada. Maximo 2MB.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value),
      "URL de imagen invalida."
    )
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
    }, "Decision invalida.")
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
    }, "Decision invalida.")
});

export const friendSearchQuerySchema = z.object({
  q: z.string().trim().min(2, "La busqueda debe tener al menos 2 caracteres.").max(80, "La busqueda es demasiado larga.")
});

export const googlePlacesSearchSchema = z.object({
  query: z.string().trim().min(3, "La busqueda debe tener al menos 3 caracteres.").max(120, "La busqueda es demasiado larga."),
  center: z
    .object({
      lat: z.coerce.number().min(-90, "La latitud no es valida.").max(90, "La latitud no es valida."),
      lng: z.coerce.number().min(-180, "La longitud no es valida.").max(180, "La longitud no es valida.")
    })
    .nullable()
    .optional()
});

export const googlePlaceDetailsSchema = z.object({
  externalPlaceId: z
    .string()
    .trim()
    .min(1, "Identificador externo obligatorio.")
    .max(255, "Identificador externo invalido.")
});

export const updatePlaceFavoriteSchema = z.object({
  groupId: uuidSchema,
  placeId: uuidSchema,
  isFavorite: z
    .string()
    .refine((value): value is "true" | "false" => value === "true" || value === "false", {
      message: "Favorito invalido."
    })
    .transform((value) => value === "true")
});

export const googlePlacesNearbySchema = z.object({
  lat: z.coerce.number().min(-90, "La latitud no es valida.").max(90, "La latitud no es valida."),
  lng: z.coerce.number().min(-180, "La longitud no es valida.").max(180, "La longitud no es valida."),
  selectedName: z
    .string()
    .trim()
    .max(120, "El nombre seleccionado es demasiado largo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
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
    .regex(/^[a-z0-9_.-]+$/i, "El @usuario solo puede contener letras, numeros, punto, guion y guion bajo."),
  avatarUrl: z
    .string()
    .trim()
    .max(3_000_000, "La imagen es demasiado pesada. Maximo 2MB.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value === null || /^https?:\/\/\S+$/i.test(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value),
      "URL de imagen invalida."
    )
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;
export type CreatePersonalPlaceInput = z.infer<typeof createPersonalPlaceSchema>;
export type UpdatePlaceStatusInput = z.infer<typeof updatePlaceStatusSchema>;
export type UpdatePlaceFavoriteInput = z.infer<typeof updatePlaceFavoriteSchema>;
export type UpdatePlaceLocationInput = z.infer<typeof updatePlaceLocationSchema>;
export type ReviewJoinRequestInput = z.infer<typeof reviewJoinRequestSchema>;
export type UpdateGroupSettingsInput = z.infer<typeof updateGroupSettingsSchema>;
export type UpdateGroupDetailsInput = z.infer<typeof updateGroupDetailsSchema>;
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<typeof respondFriendRequestSchema>;
export type RemoveFriendInput = z.infer<typeof removeFriendSchema>;
export type InviteFriendToGroupInput = z.infer<typeof inviteFriendToGroupSchema>;
export type RespondGroupInvitationInput = z.infer<typeof respondGroupInvitationSchema>;
export type FriendSearchQueryInput = z.infer<typeof friendSearchQuerySchema>;
export type GooglePlacesSearchInput = z.infer<typeof googlePlacesSearchSchema>;
export type GooglePlaceDetailsInput = z.infer<typeof googlePlaceDetailsSchema>;
export type GooglePlacesNearbyInput = z.infer<typeof googlePlacesNearbySchema>;
