import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const createTeamSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug trop court")
    .max(40, "Slug trop long")
    .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),
  name: z.string().trim().min(1, "Nom requis").max(80),
  color: z.string().regex(HEX_COLOR, "Couleur hex (ex: #2563eb)").default("#6b7280"),
});

export const updateTeamSchema = createTeamSchema.partial();

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
