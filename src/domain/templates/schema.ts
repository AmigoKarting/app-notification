import { z } from "zod";

const optionalUuid = z
  .string()
  .uuid()
  .or(z.literal(""))
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null));

export const baseTemplateSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(80),
  kind: z.enum(["notification", "reminder"]).default("notification"),
  title: z.string().trim().min(1, "Titre requis").max(160),
  body: optionalString(5000),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  category_id: optionalUuid,
  action_label: optionalString(60),
  action_url: z
    .string()
    .trim()
    .url("URL invalide")
    .optional()
    .or(z.literal(""))
    .or(z.null())
    .transform((v) => (v && typeof v === "string" && v.length > 0 ? v : null)),
  send_channels: z.array(z.enum(["email", "sms"])).default([]),
});

export const createTemplateSchema = baseTemplateSchema.refine(
  (v) => (v.action_label === null) === (v.action_url === null),
  { message: "Renseigner libellé ET URL, ou aucun des deux", path: ["action_url"] },
);

export const updateTemplateSchema = baseTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
