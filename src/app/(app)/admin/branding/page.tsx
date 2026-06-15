import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { getAppSettings } from "@/domain/branding/repository";
import { listAllBanners } from "@/domain/role-banners/repository";
import { listRolesWithPermissions } from "@/domain/roles/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { BrandingForm } from "./branding-form";
import { BannersManager } from "../../settings/banners-manager";

export const dynamic = "force-dynamic";

export default async function AdminBrandingPage() {
  const t = getServerDictionary();
  const [settings, banners, allRoles] = await Promise.all([
    getAppSettings(),
    listAllBanners(),
    listRolesWithPermissions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminBranding.title}
        description={t.adminBranding.description}
        action={
          <LinkButton href="/admin" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <Card className="p-6">
        <BrandingForm
          initial={{
            app_name: settings.app_name,
            app_tagline: settings.app_tagline,
            logo_url: settings.logo_url,
          }}
        />
      </Card>

      <Card className="p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {t.bannersAdmin.sectionTitle}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t.bannersAdmin.sectionDesc}
          </p>
        </div>
        <BannersManager
          banners={banners.map((b) => ({
            role_slug: b.role_slug,
            enabled: b.enabled,
            message: b.message,
            cta_label: b.cta_label,
            cta_url: b.cta_url,
            icon: b.icon,
            color: b.color,
            dismiss_condition: b.dismiss_condition,
          }))}
          allRoles={allRoles.map((r) => ({
            slug: r.slug,
            name: r.name,
            icon: r.icon,
          }))}
        />
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.adminBranding.aboutTitle}</h2>
        <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
          <li>• {t.adminBranding.aboutLogo}</li>
          <li>• {t.adminBranding.aboutName}</li>
          <li>• {t.adminBranding.aboutAccent}</li>
          <li>• {t.adminBranding.aboutGlobal}</li>
        </ul>
      </Card>
      <PageTip>{t.pageTips.adminBranding}</PageTip>
    </div>
  );
}
