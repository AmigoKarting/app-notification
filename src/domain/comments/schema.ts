import { z } from "zod";

export const createCommentSchema = z.object({
  feed_item_id: z.string().uuid("Identifiant invalide"),
  body: z.string().trim().min(1, "Message vide").max(2000, "Message trop long"),
});

export const updateCommentSchema = z.object({
  body: z.string().trim().min(1, "Message vide").max(2000, "Message trop long"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
