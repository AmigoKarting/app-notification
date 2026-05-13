import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const createCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug trop court")
    .max(40, "Slug trop long")
    .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),
  name: z.string().trim().min(1, "Nom requis").max(80),
  color: z.string().regex(HEX_COLOR, "Couleur hex (ex: #2563eb)").default("#6b7280"),
  icon: z.string().trim().max(8).optional().or(z.literal("")).transform((v) => (v ? v : null)),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
