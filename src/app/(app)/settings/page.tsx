import { Card, LinkButton, PageHeader } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { listCategories } from "@/domain/categories/repository";
import { listMutedCategoryIds } from "@/domain/category-mutes/repository";
import { ProfileForm } from "../profile/profile-form";
import { MuteSection } from "./mute-section";
import { ThemeSection } from "./theme-section";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const [profile, categories, mutedIds] = await Promise.all([
    getCurrentProfile(),
    listCategories(),
    listMutedCategoryIds(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réglages"
        description="Profil, apparence, et préférences de notifications."
        action={
          <LinkButton href="/feed" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      {/* Section Profil */}
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Profil</h2>
            <p className="text-sm text-neutral-600">Ton nom affiché et tes infos de compte.</p>
          </div>
          {profile && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                profile.role === "dev"
                  ? "bg-brand-50 text-brand-700 ring-brand-200"
                  : "bg-neutral-100 text-neutral-700 ring-neutral-200"
              }`}
            >
              {profile.role}
            </span>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </div>

        <ProfileForm
          userId={user.id}
          initialName={profile?.display_name ?? ""}
          initialFirstName={profile?.first_name ?? ""}
          initialLastName={profile?.last_name ?? ""}
          initialPhone={profile?.phone ?? ""}
        />
      </Card>

      {/* Section Apparence */}
      <Card className="p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-neutral-900">Apparence</h2>
          <p className="text-sm text-neutral-600">
            Choisis la couleur d'accent qui te plaît.
          </p>
        </div>
        <ThemeSection />
      </Card>

      {/* Section Notifications — silencieuses par catégorie */}
      <Card className="p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-neutral-900">Mes notifications</h2>
          <p className="text-sm text-neutral-600">
            Coupe le son sur les catégories qui ne t'intéressent pas.
          </p>
        </div>
        <MuteSection
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            icon: c.icon,
          }))}
          mutedIds={mutedIds}
        />
      </Card>
    </div>
  );
}
