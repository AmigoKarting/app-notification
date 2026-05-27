import Link from "next/link";
import type { RoleBanner } from "@/domain/role-banners/repository";

interface Props {
  banner: RoleBanner;
}

/**
 * Bannière configurable affichée en haut de l'app pour un rôle donné.
 * Le filtre "à afficher ou pas" est calculé côté serveur dans le layout
 * (en évaluant le dismiss_condition).
 */
export function RoleBanner({ banner }: Props) {
  const isExternal = banner.cta_url.startsWith("http");
  const ctaLabel = banner.cta_label?.trim() || null;

  return (
    <div
      className="border-b"
      style={{
        backgroundColor: `${banner.color}1f`,
        borderColor: `${banner.color}55`,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <p
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: banner.color }}
        >
          <span className="text-base">{banner.icon}</span>
          <span>{banner.message}</span>
        </p>
        {ctaLabel && (
          <Link
            href={banner.cta_url}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: banner.color }}
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
