"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDev } from "@/domain/auth/role";
import { createClient } from "@/lib/supabase/server";

const setRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["employee", "dev", "caissiere"]),
});

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const me = await requireDev();
  const parsed = setRoleSchema.safeParse({
    user_id: formData.get("user_id"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;

  // Empêche un dev de se rétrograder lui-même (sinon plus aucun dev possible)
  if (parsed.data.user_id === me.id && parsed.data.role !== "dev") {
    return;
  }

  const supabase = createClient();
  await supabase.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.user_id);
  revalidatePath("/admin/users");
}
