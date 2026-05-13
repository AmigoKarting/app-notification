import { z } from "zod";

export const updateBrandingSchema = z.object({
  app_name: z.string().trim().min(1, "Nom requis").max(80),
  app_tagline: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  logo_url: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal(""))
    .or(z.null())
    .transform((v) => (v && typeof v === "string" && v.length > 0 ? v : null)),
});

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
