import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { listCategories } from "@/domain/categories/repository";
import { listMutedCategoryIds } from "@/domain/category-mutes/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { ProfileForm } from "../profile/profile-form";
import { MuteSection } from "./mute-section";
import { ThemeSection } from "./theme-section";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const t = getServerDictionary();
  const user = await requireUser();
  const [profile, categories, mutedIds] = await Promise.all([
    getCurrentProfile(),
    listCategories(),
    listMutedCategoryIds(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.settings.title}
        description={t.settings.description}
        action={
          <LinkButton href="/feed" variant="secondary">
            {t.settings.back}
          </LinkButton>
        }
      />

      {/* Section Profil */}
      <Card className="p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">{t.settings.profile}</h2>
            <p className="text-sm text-neutral-600">{t.settings.profileDesc}</p>
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
            <p className="text-xs uppercase tracking-wide text-neutral-500">{t.settings.emailLabel}</p>
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
      <Card className="p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-neutral-900">{t.settings.appearance}</h2>
          <p className="text-sm text-neutral-600">
            {t.settings.appearanceDesc}
          </p>
        </div>
        <ThemeSection />
      </Card>

      {/* Section Notifications — silencieuses par catégorie */}
      <Card className="p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-neutral-900">{t.settings.myNotifications}</h2>
          <p className="text-sm text-neutral-600">
            {t.settings.myNotificationsDesc}
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

      <PageTip>{t.pageTips.settings}</PageTip>
    </div>
  );
}
