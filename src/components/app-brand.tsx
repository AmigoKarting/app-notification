import { getAppSettings } from "@/domain/branding/repository";

const DEFAULT_LOGO = "/logo-amigo.png";

export async function AppLogo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const settings = await getAppSettings();
  const logoSrc = settings.logo_url || DEFAULT_LOGO;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={settings.app_name}
      width={size * 2.5}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ height: size }}
    />
  );
}

/**
 * Nom de l'app (texte brut). Pour usage dans des titres,
 * spans, alt, etc.
 */
export async function AppName() {
  const settings = await getAppSettings();
  return <>{settings.app_name}</>;
}

export async function AppTagline() {
  const settings = await getAppSettings();
  if (!settings.app_tagline) return null;
  return <>{settings.app_tagline}</>;
}

export async function getBranding() {
  return getAppSettings();
}
