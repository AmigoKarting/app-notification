import { z } from "zod";

export const reminderStatusEnum = z.enum(["pending", "sent", "cancelled", "failed"]);

const scheduledAtSchema = z
  .string()
  .min(1, "Date requise")
  .transform((v, ctx) => {
    const date = new Date(v);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date invalide" });
      return z.NEVER;
    }
    return date.toISOString();
  });

export const createReminderSchema = z.object({
  employee_id: z.string().uuid("Employé invalide"),
  message: z.string().trim().min(1, "Message requis").max(2000, "Message trop long"),
  scheduled_at: scheduledAtSchema,
  status: reminderStatusEnum.default("pending"),
});

export const updateReminderSchema = z
  .object({
    employee_id: z.string().uuid("Employé invalide"),
    message: z.string().trim().min(1, "Message requis").max(2000, "Message trop long"),
    scheduled_at: scheduledAtSchema,
    status: reminderStatusEnum,
  })
  .partial();

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
