import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { listCategories } from "@/domain/categories/repository";
import { listMutedCategoryIds } from "@/domain/category-mutes/repository";
import { getServerDictionary, getDateFormat } from "@/lib/i18n/server";
import { PushToggle } from "@/components/push-toggle";
import { ProfileForm } from "../profile/profile-form";
import { DateFormatSection } from "./date-format-section";
import { MuteSection } from "./mute-section";
import { ThemeSection } from "./theme-section";

export const dynamic = "force-dynamic";

// Slug de la catégorie système réservée aux rappels checklist caissière.
// Définie dans la migration 0020.
const CASHIER_CATEGORY_SLUG = "checklist-caisse";

export default async function SettingsPage() {
  const t = getServerDictionary();
  const user = await requireUser();
  const [profile, allCategories, mutedIds] = await Promise.all([
    getCurrentProfile(),
    listCategories(),
    listMutedCategoryIds(user.id),
  ]);

  const isCashier = profile?.role === "caissiere";
  const isDev = profile?.role === "dev";
  const backHref = isCashier ? "/checklist" : "/feed";

  // Sépare la catégorie "checklist-caisse" du reste :
  // - elle ne doit jamais apparaître dans la section générale "Mes notifications"
  // - elle apparaît dans sa propre section uniquement pour les caissières
  const cashierCategories = allCategories.filter(
    (c) => c.slug === CASHIER_CATEGORY_SLUG,
  );
  const generalCategories = allCategories.filter(
    (c) => c.slug !== CASHIER_CATEGORY_SLUG,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.settings.title}
        description={t.settings.description}
        action={
          <LinkButton href={backHref} variant="secondary">
            {t.settings.back}
          </LinkButton>
        }
      />

      {/* Section Profil */}
      <Card className="p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t.settings.profile}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.settings.profileDesc}</p>
          </div>
          {profile && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                profile.role === "dev"
                  ? "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-700"
                  : "bg-neutral-100 text-neutral-700 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-600"
              }`}
            >
              {profile.role}
            </span>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t.settings.emailLabel}</p>
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
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t.settings.appearance}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t.settings.appearanceDesc}
          </p>
        </div>
        <div className="space-y-6">
          <ThemeSection />
          <DateFormatSection initial={getDateFormat()} />
        </div>
      </Card>

      {/* Sections push + mute par catégorie : réservées aux devs.
          On ne laisse pas les employés couper leurs notifications. */}
      {isDev && (
        <>
          <Card className="p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t.settings.pushNotifications}</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t.settings.pushNotificationsDesc}
              </p>
            </div>
            <PushToggle />
          </Card>

          {cashierCategories.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/40 p-4 sm:p-6 dark:border-amber-800 dark:bg-amber-900/10">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {t.settings.cashierNotifications}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t.settings.cashierNotificationsDesc}
                </p>
              </div>
              <MuteSection
                categories={cashierCategories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  color: c.color,
                  icon: c.icon,
                }))}
                mutedIds={mutedIds}
              />
            </Card>
          )}

          <Card className="p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t.settings.myNotifications}</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t.settings.myNotificationsDesc}
              </p>
            </div>
            <MuteSection
              categories={generalCategories.map((c) => ({
                id: c.id,
                name: c.name,
                color: c.color,
                icon: c.icon,
              }))}
              mutedIds={mutedIds}
            />
          </Card>
        </>
      )}

      <PageTip>{t.pageTips.settings}</PageTip>
    </div>
  );
}
