import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { getAppSettings } from "@/domain/branding/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { BrandingForm } from "./branding-form";

export const dynamic = "force-dynamic";

export default async function AdminBrandingPage() {
  const t = getServerDictionary();
  const settings = await getAppSettings();

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
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">{t.adminBranding.aboutTitle}</h2>
        <ul className="space-y-1 text-sm text-neutral-600">
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
