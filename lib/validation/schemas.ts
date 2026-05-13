import { z } from "zod";
import {
  GROUP_JOIN_POLICY_VALUES,
  GROUP_JOIN_REQUEST_STATUS_VALUES,
  GROUP_PLACE_EDIT_POLICY_VALUES
} from "@/lib/groups/policies";

export const PLACE_STATUS_VALUES = ["pending", "visited", "favorite"] as const;

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
  placeEditPolicy: z
    .string()
    .optional()
    .transform((value) => value || "members_can_edit")
    .refine((value): value is (typeof GROUP_PLACE_EDIT_POLICY_VALUES)[number] => {
      return GROUP_PLACE_EDIT_POLICY_VALUES.includes(value as never);
    }, "Politica de edicion invalida."),
  joinPolicy: z
    .string()
    .optional()
    .transform((value) => value || "open_by_code")
    .refine((value): value is (typeof GROUP_JOIN_POLICY_VALUES)[number] => {
      return GROUP_JOIN_POLICY_VALUES.includes(value as never);
    }, "Politica de acceso invalida.")
});

export const joinGroupSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(1, "El codigo del grupo es obligatorio.")
    .max(20, "El codigo del grupo no es valido.")
    .transform((value) => value.toUpperCase())
});

export const createPlaceSchema = z.object({
  groupId: z.string().trim().min(1, "Grupo invalido."),
  name: z.string().trim().min(1, "El nombre del lugar es obligatorio.").max(120, "El nombre es demasiado largo."),
  address: z
    .string()
    .trim()
    .min(1, "La direccion del lugar es obligatoria.")
    .max(220, "La direccion es demasiado larga."),
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
    .transform((value) => (value && value.length > 0 ? value : null))
});

export const updatePlaceStatusSchema = z.object({
  groupId: z.string().trim().min(1, "Datos invalidos para actualizar el estado."),
  placeId: z.string().trim().min(1, "Datos invalidos para actualizar el estado."),
  status: z
    .string()
    .refine((value): value is (typeof PLACE_STATUS_VALUES)[number] => PLACE_STATUS_VALUES.includes(value as never), {
      message: "Estado invalido."
    })
});

export const reviewJoinRequestSchema = z.object({
  groupId: z.string().trim().min(1, "Grupo invalido."),
  requestId: z.string().trim().min(1, "Solicitud invalida."),
  decision: z
    .string()
    .refine((value): value is Exclude<(typeof GROUP_JOIN_REQUEST_STATUS_VALUES)[number], "pending"> => {
      return value === "approved" || value === "rejected";
    }, "Decision invalida.")
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;
export type UpdatePlaceStatusInput = z.infer<typeof updatePlaceStatusSchema>;
export type ReviewJoinRequestInput = z.infer<typeof reviewJoinRequestSchema>;
