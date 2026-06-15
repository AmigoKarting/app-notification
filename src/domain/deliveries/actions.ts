"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDev } from "@/domain/auth/role";
import { retryDelivery } from "./repository";
import { logAudit } from "@/domain/audit/repository";

export async function retryDeliveryAction(formData: FormData): Promise<void> {
  const dev = await requireDev();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await retryDelivery(id.data);
  logAudit({ userId: dev.id, action: "retry", entityType: "delivery", entityId: id.data }).catch(() => {});
  revalidatePath("/admin/deliveries");
}
