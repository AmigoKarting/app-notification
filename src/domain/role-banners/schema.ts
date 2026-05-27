import { z } from "zod";

export const dismissConditionEnum = z.enum(["none", "cashier_checklist_done"]);

const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hex invalide")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : "#f59e0b"));

const iconSchema = z
  .string()
  .trim()
  .max(4)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : "📋"));

const ctaUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : "/"));

const ctaLabelSchema = z
  .string()
  .trim()
  .max(40)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : null));

const dismissSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .or(z.null())
  .transform((v) => {
    if (!v || v === "" || v === "none") return null;
    return v;
  });

const enabledSchema = z
  .preprocess((v) => v === "on" || v === "true" || v === true, z.boolean())
  .default(true);

export const createBannerSchema = z.object({
  role_slug: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]*$/, "Slug invalide"),
  enabled: enabledSchema,
  message: z.string().trim().min(1, "Message requis").max(160),
  cta_label: ctaLabelSchema,
  cta_url: ctaUrlSchema,
  icon: iconSchema,
  color: colorSchema,
  dismiss_condition: dismissSchema,
});

export const updateBannerSchema = createBannerSchema;

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
