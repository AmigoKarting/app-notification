import { z } from "zod";

const optionalTrimmed = z
  .string()
  .trim()
  .max(40)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === undefined || v === "" ? null : v));

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120, "Nom trop long"),
  email: z.string().trim().toLowerCase().email("Email invalide").max(254),
  phone: optionalTrimmed,
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
