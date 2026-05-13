import { headers } from "next/headers";
import Link from "next/link";
import { LinkButton } from "@/components/ui";

export interface GuideEntry {
  href: string;
  title: string;
  icon: string;
  description?: string;
}

export interface GuideCategory {
  label: string;
  entries: GuideEntry[];
}

/**
 * Ordre canonique des guides. Sert au layout (sidebar) ET aux pages
 * (pour calculer Précédent/Suivant).
 */
export const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    label: "Premiers pas",
    entries: [
      {
        href: "/admin/aide/bien-demarrer",
        title: "Bien démarrer",
        icon: "⚡",
        description: "Tour rapide de l'app",
      },
    ],
  },
  {
    label: "Notifications",
    entries: [
      {
        href: "/admin/aide/envoyer-notification",
        title: "Publier une notification",
        icon: "🔔",
        description: "Création, ciblage, dates",
      },
      {
        href: "/admin/aide/planifier",
        title: "Planifier des envois récurrents",
        icon: "🕐",
        description: "Heures, jours, fuseau",
      },
      {
        href: "/admin/aide/modeles",
        title: "Modèles réutilisables",
        icon: "📋",
        description: "Gagner du temps",
      },
      {
        href: "/admin/aide/mise-en-forme",
        title: "Mise en forme et variables",
        icon: "📝",
        description: "Markdown + {name} {email}",
      },
      {
        href: "/admin/aide/engagement",
        title: "Réactions et commentaires",
        icon: "💬",
        description: "Lectures, réactions, fils",
      },
      {
        href: "/admin/aide/suivi-admin",
        title: "Suivi côté admin",
        icon: "📊",
        description: "Stats, filtres, audit",
      },
    ],
  },
  {
    label: "Organisation",
    entries: [
      {
        href: "/admin/aide/categories",
        title: "Catégories",
        icon: "🏷",
        description: "Étiquettes colorées",
      },
      {
        href: "/admin/aide/sessions",
        title: "Sessions et périodes",
        icon: "📅",
        description: "Fenêtres temporelles",
      },
      {
        href: "/admin/aide/equipes",
        title: "Équipes",
        icon: "👥",
        description: "Groupes de personnes",
      },
    ],
  },
  {
    label: "Utilisateurs",
    entries: [
      {
        href: "/admin/aide/utilisateurs",
        title: "Rôles et permissions",
        icon: "👤",
        description: "Dev vs employé",
      },
      {
        href: "/admin/aide/preferences",
        title: "Mes préférences",
        icon: "🔕",
        description: "Mute, profil, thème",
      },
    ],
  },
  {
    label: "Personnalisation",
    entries: [
      {
        href: "/admin/aide/personnaliser",
        title: "Logo et apparence",
        icon: "🖌",
        description: "Marque + couleur",
      },
    ],
  },
  {
    label: "Déploiement",
    entries: [
      {
        href: "/admin/aide/production",
        title: "Mettre en production",
        icon: "🚀",
        description: "Supabase + Vercel + Resend + cron",
      },
    ],
  },
];

export const FLAT_GUIDES: GuideEntry[] = GUIDE_CATEGORIES.flatMap((c) => c.entries);

function isActive(href: string, pathname: string): boolean {
  return pathname === href;
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") ?? "";
  const onIndex = pathname === "/admin/aide";

  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
      {/* Sidebar d'aide */}
      <aside className="hidden lg:block">
        <nav className="sticky top-20 space-y-5">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
            >
              ← Retour à l'admin
            </Link>
          </div>

          <Link
            href="/admin/aide"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              onIndex ? "bg-brand-50 text-brand-800" : "text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            📚 Tous les guides
          </Link>

          {GUIDE_CATEGORIES.map((category) => (
            <div key={category.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                {category.label}
              </p>
              <ul className="space-y-0.5">
                {category.entries.map((entry) => {
                  const active = isActive(entry.href, pathname);
                  return (
                    <li key={entry.href}>
                      <Link
                        href={entry.href}
                        className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "bg-brand-50 font-medium text-brand-800"
                            : "text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        <span className="leading-none mt-0.5">{entry.icon}</span>
                        <span className="flex-1">{entry.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Sélecteur compact sur mobile */}
      <div className="lg:hidden mb-2 -mx-6 overflow-x-auto border-y border-neutral-200 bg-white px-6">
        <ul className="flex gap-1 whitespace-nowrap py-2 text-sm">
          <li>
            <Link
              href="/admin/aide"
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ${
                onIndex
                  ? "bg-brand-50 font-medium text-brand-800"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              📚 Index
            </Link>
          </li>
          {FLAT_GUIDES.map((entry) => {
            const active = isActive(entry.href, pathname);
            return (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ${
                    active
                      ? "bg-brand-50 font-medium text-brand-800"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <span>{entry.icon}</span>
                  {entry.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
