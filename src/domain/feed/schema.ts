import { z } from "zod";

export const feedKindEnum = z.enum(["notification", "reminder"]);
export const feedPriorityEnum = z.enum(["low", "normal", "high"]);
export const feedTargetModeEnum = z.enum(["all", "teams", "users"]);
export const sendChannelEnum = z.enum(["email", "sms"]);

const optionalUuid = z
  .string()
  .uuid()
  .or(z.literal(""))
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const optionalDatetime = z
  .string()
  .or(z.literal(""))
  .optional()
  .transform((v, ctx) => {
    if (!v || v === "") return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date invalide" });
      return z.NEVER;
    }
    return d.toISOString();
  });

export const baseFeedSchema = z.object({
  kind: feedKindEnum,
  title: z.string().trim().min(1, "Titre requis").max(160),
  body: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  category_id: optionalUuid,
  session_id: optionalUuid,
  priority: feedPriorityEnum.default("normal"),
  due_date: optionalDatetime,
  published_at: optionalDatetime,
  expires_at: optionalDatetime,
  // Ciblage
  target_mode: feedTargetModeEnum.default("all"),
  target_roles: z.array(z.string()).default([]),
  target_team_ids: z.array(z.string().uuid()).default([]),
  target_user_ids: z.array(z.string().uuid()).default([]),
  // Nouvelles options de config
  is_draft: z.boolean().default(false),
  is_pinned: z.boolean().default(false),
  image_url: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal(""))
    .or(z.null())
    .transform((v) => (v && typeof v === "string" && v.length > 0 ? v : null)),
  send_channels: z.array(sendChannelEnum).default([]),
  // CTA: les deux ou aucun (CHECK constraint Postgres fait la garde aussi)
  action_label: z
    .string()
    .trim()
    .max(60)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  action_url: z
    .string()
    .trim()
    .url("URL invalide")
    .optional()
    .or(z.literal(""))
    .or(z.null())
    .transform((v) => (v && typeof v === "string" && v.length > 0 ? v : null)),
});

// On garde baseFeedSchema comme ZodObject pur pour pouvoir l'étendre
// avec .partial() (utilisé pour updateFeedItemSchema). Les .refine()
// vivent sur createFeedItemSchema.
export const createFeedItemSchema = baseFeedSchema
  .refine((v) => v.kind !== "reminder" || v.due_date !== null, {
    message: "Une échéance est requise pour un rappel",
    path: ["due_date"],
  })
  .refine((v) => v.target_mode !== "teams" || v.target_team_ids.length > 0, {
    message: "Sélectionner au moins une équipe",
    path: ["target_team_ids"],
  })
  .refine((v) => v.target_mode !== "users" || v.target_user_ids.length > 0, {
    message: "Sélectionner au moins un employé",
    path: ["target_user_ids"],
  })
  .refine((v) => (v.action_label === null) === (v.action_url === null), {
    message: "Renseigner libellé ET URL, ou aucun des deux",
    path: ["action_url"],
  });

export const updateFeedItemSchema = baseFeedSchema.partial();

export type CreateFeedItemInput = z.infer<typeof createFeedItemSchema>;
export type UpdateFeedItemInput = z.infer<typeof updateFeedItemSchema>;
