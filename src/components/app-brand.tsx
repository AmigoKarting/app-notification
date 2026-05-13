import { LogoMark } from "@/components/ui";
import { getAppSettings } from "@/domain/branding/repository";

/**
 * Logo de l'app:
 *  - Image custom si app_settings.logo_url est défini
 *  - Sinon le LogoMark SVG par défaut (avec gradient)
 */
export async function AppLogo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const settings = await getAppSettings();
  if (settings.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={settings.logo_url}
        alt={settings.app_name}
        width={size}
        height={size}
        className={`shrink-0 rounded-md object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return <LogoMark size={size} className={className} />;
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
