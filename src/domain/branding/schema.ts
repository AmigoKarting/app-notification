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

export const updateCashierBannerSchema = z.object({
  cashier_banner_enabled: z
    .preprocess(
      (v) => v === "on" || v === "true" || v === true,
      z.boolean(),
    ),
  cashier_banner_message: z
    .string()
    .trim()
    .max(160)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  cashier_banner_cta: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type UpdateCashierBannerInput = z.infer<typeof updateCashierBannerSchema>;
