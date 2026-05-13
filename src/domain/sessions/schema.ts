import { z } from "zod";

const datetimeISO = z
  .string()
  .min(1, "Date requise")
  .transform((v, ctx) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date invalide" });
      return z.NEVER;
    }
    return d.toISOString();
  });

const baseSchema = z.object({
  category_id: z.string().uuid("Catégorie requise"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),
  name: z.string().trim().min(1, "Nom requis").max(120),
  starts_at: datetimeISO,
  ends_at: datetimeISO,
  is_active: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean(), z.undefined()])
    .transform((v) => v === true || v === "on" || v === "true"),
});

export const createSessionSchema = baseSchema.refine(
  (v) => new Date(v.ends_at).getTime() > new Date(v.starts_at).getTime(),
  { message: "La fin doit être après le début", path: ["ends_at"] },
);

export const updateSessionSchema = baseSchema.partial();

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
