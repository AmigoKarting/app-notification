import { z } from "zod";

export const SUPPORTED_TIMEZONES = [
  "America/Montreal",
  "America/Toronto",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Paris",
  "Europe/London",
  "Europe/Brussels",
  "Africa/Casablanca",
  "Asia/Dubai",
  "Asia/Tokyo",
  "UTC",
] as const;

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number];

const optionalUuid = z
  .string()
  .uuid()
  .or(z.literal(""))
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const baseSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(160),
  body: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null)),
  kind: z.enum(["notification", "reminder"]).default("notification"),
  category_id: optionalUuid,
  session_id: optionalUuid,
  priority: z.enum(["low", "normal", "high"]).default("normal"),

  timezone: z.string().refine((v) => (SUPPORTED_TIMEZONES as readonly string[]).includes(v), {
    message: "Fuseau horaire non supporté",
  }),
  times: z
    .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM attendu"))
    .min(1, "Au moins une heure"),
  days_of_week: z
    .array(z.number().int().min(1).max(7))
    .min(1, "Au moins un jour"),

  target_mode: z.enum(["all", "teams", "users"]).default("all"),
  target_team_ids: z.array(z.string().uuid()).default([]),
  target_user_ids: z.array(z.string().uuid()).default([]),

  is_active: z.boolean().default(true),
});

export const createScheduleSchema = baseSchema
  .refine((v) => v.target_mode !== "teams" || v.target_team_ids.length > 0, {
    message: "Sélectionner au moins une équipe",
    path: ["target_team_ids"],
  })
  .refine((v) => v.target_mode !== "users" || v.target_user_ids.length > 0, {
    message: "Sélectionner au moins un employé",
    path: ["target_user_ids"],
  });

export const updateScheduleSchema = baseSchema.partial();

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
