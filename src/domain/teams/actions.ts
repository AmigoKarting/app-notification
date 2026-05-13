"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDev } from "@/domain/auth/role";
import { RepositoryError } from "@/domain/errors";
import { type FormState } from "@/domain/form-state";
import {
  createTeam,
  deleteTeam,
  setTeamMembers,
  updateTeam,
  type Team,
} from "./repository";
import { createTeamSchema, updateTeamSchema } from "./schema";

function fieldErrorsFromZod(err: import("zod").ZodError<unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

function mapError(err: unknown): FormState<Team> {
  if (err instanceof RepositoryError) {
    if (err.code === "conflict") {
      return { status: "error", message: "Slug déjà utilisé.", fieldErrors: { slug: "Déjà pris" } };
    }
    return { status: "error", message: err.message };
  }
  return { status: "error", message: "Erreur inattendue" };
}

export async function createTeamAction(
  _prev: FormState<Team>,
  formData: FormData,
): Promise<FormState<Team>> {
  const profile = await requireDev();
  const parsed = createTeamSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  try {
    await createTeam(profile.id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/teams");
  redirect("/admin/teams");
}

export async function updateTeamAction(
  id: string,
  _prev: FormState<Team>,
  formData: FormData,
): Promise<FormState<Team>> {
  await requireDev();
  const parsed = updateTeamSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Données invalides",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  try {
    await updateTeam(id, parsed.data);
  } catch (err) {
    return mapError(err);
  }
  revalidatePath("/admin/teams");
  revalidatePath(`/admin/teams/${id}`);
  return { status: "success", message: "Équipe mise à jour." };
}

export async function deleteTeamAction(formData: FormData): Promise<void> {
  await requireDev();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteTeam(id);
  revalidatePath("/admin/teams");
  redirect("/admin/teams");
}

// ---------------------------------------------------------------------
// Membres
// ---------------------------------------------------------------------
const setMembersSchema = z.object({
  team_id: z.string().uuid(),
  user_ids: z.array(z.string().uuid()),
});

export async function setTeamMembersAction(formData: FormData): Promise<void> {
  await requireDev();
  const parsed = setMembersSchema.safeParse({
    team_id: formData.get("team_id"),
    user_ids: formData.getAll("user_ids"),
  });
  if (!parsed.success) return;
  await setTeamMembers(parsed.data.team_id, parsed.data.user_ids);
  revalidatePath(`/admin/teams/${parsed.data.team_id}`);
}
