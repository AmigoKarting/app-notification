import { z } from "zod";
import { PERMISSION_KEYS } from "./permissions";

export const roleSlugSchema = z
  .string()
  .trim()
  .min(2, "Identifiant trop court")
  .max(40, "Identifiant trop long")
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Lettres minuscules, chiffres ou _ uniquement. Doit commencer par une lettre.",
  );

export const createRoleSchema = z.object({
  slug: roleSlugSchema,
  name: z.string().trim().min(1, "Nom requis").max(60),
  description: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hex invalide")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : "#6b7280")),
  icon: z
    .string()
    .trim()
    .max(4)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  permissions: z
    .array(z.enum(PERMISSION_KEYS as [string, ...string[]]))
    .default([]),
});

export const updateRoleSchema = z.object({
  slug: roleSlugSchema,
  name: z.string().trim().min(1, "Nom requis").max(60),
  description: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hex invalide")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : "#6b7280")),
  icon: z
    .string()
    .trim()
    .max(4)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  permissions: z
    .array(z.enum(PERMISSION_KEYS as [string, ...string[]]))
    .default([]),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
