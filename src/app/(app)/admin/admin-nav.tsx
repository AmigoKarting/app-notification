"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  BrushIcon,
  CalendarIcon,
  ClockIcon,
  HomeIcon,
  SendIcon,
  SparkleIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui";

type NavEntry = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type NavSection = { label: string; entries: NavEntry[] };

const NAV: NavSection[] = [
  {
    label: "Aperçu",
    entries: [{ href: "/admin", label: "Tableau de bord", icon: HomeIcon }],
  },
  {
    label: "Contenu",
    entries: [
      { href: "/admin/feed", label: "Notifications", icon: BellIcon },
      { href: "/admin/schedules", label: "Planifications", icon: ClockIcon },
      { href: "/admin/templates", label: "Modèles", icon: TagIcon },
    ],
  },
  {
    label: "Structure",
    entries: [
      { href: "/admin/categories", label: "Catégories", icon: TagIcon },
      { href: "/admin/sessions", label: "Sessions", icon: CalendarIcon },
      { href: "/admin/teams", label: "Équipes", icon: UsersIcon },
    ],
  },
  {
    label: "Système",
    entries: [
      { href: "/admin/users", label: "Utilisateurs", icon: UserIcon },
      { href: "/admin/deliveries", label: "Envois", icon: SendIcon },
      { href: "/admin/branding", label: "Marque", icon: BrushIcon },
    ],
  },
  {
    label: "Aide",
    entries: [{ href: "/admin/aide", label: "Guides", icon: SparkleIcon }],
  },
];

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-20 space-y-6">
        {NAV.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.entries.map((entry) => {
                const Icon = entry.icon;
                const active = isActive(entry.href, pathname);
                return (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-brand-100 font-semibold text-brand-900 ring-2 ring-brand-300 shadow-sm"
                          : "text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={active ? "text-brand-700" : "text-neutral-400 group-hover:text-neutral-700"}
                      />
                      <span className="flex-1 truncate">{entry.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden -mx-6 mb-2 overflow-x-auto border-y border-neutral-200 bg-white px-6">
      <ul className="flex gap-1 whitespace-nowrap py-2 text-sm">
        {NAV.flatMap((s) => s.entries).map((entry) => {
          const active = isActive(entry.href, pathname);
          return (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                  active
                    ? "bg-brand-100 font-semibold text-brand-900 ring-2 ring-brand-300"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {entry.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
