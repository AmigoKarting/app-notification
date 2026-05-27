"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDev } from "@/domain/auth/role";
import { createAdminClient } from "@/lib/supabase/admin";

// Slug = lettres minuscules, chiffres, underscores. Cohérent avec
// l'enum app_role étendu dynamiquement par create_custom_role().
const setRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.string().regex(/^[a-z][a-z0-9_]*$/, "Slug invalide"),
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

  // Vérifie que le slug correspond bien à un rôle enregistré dans la table.
  const supabase = createAdminClient();
  const { data: role } = await supabase
    .from("roles")
    .select("slug")
    .eq("slug", parsed.data.role)
    .maybeSingle();
  if (!role) return;

  await supabase.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.user_id);
  revalidatePath("/admin/users");
}
