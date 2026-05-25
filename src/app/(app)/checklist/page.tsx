import { redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { hasSubmittedToday } from "@/domain/checklists/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { ChecklistForm } from "./checklist-form";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const t = getServerDictionary();
  const user = await requireUser();
  const profile = await getCurrentProfile();

  // Caissières et devs : l'admin doit pouvoir tester la checklist
  // sans changer de compte.
  if (profile?.role !== "caissiere" && profile?.role !== "dev") {
    redirect("/feed");
  }

  const alreadyDone = await hasSubmittedToday(user.id);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader
        title={t.checklist.title}
        description={t.checklist.description}
      />

      {!alreadyDone && (
        <Card className="border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            <span>📋</span>
            {t.checklist.reminder}
          </p>
        </Card>
      )}

      <ChecklistForm alreadySubmittedToday={alreadyDone} />
    </div>
  );
}
