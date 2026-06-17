"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertIcon,
  BarChartIcon,
  BellIcon,
  BrushIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  SendIcon,
  SparkleIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui";
import { useTranslation, type Dictionary } from "@/lib/i18n";

type NavEntry = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type NavSection = { label: string; entries: NavEntry[] };

function getNav(t: Dictionary["nav"]): NavSection[] {
  return [
    {
      label: t.overview,
      entries: [{ href: "/admin", label: t.dashboard, icon: HomeIcon }],
    },
    {
      label: t.content,
      entries: [
        { href: "/admin/feed", label: t.notifications, icon: BellIcon },
        { href: "/admin/reminders", label: t.reminders, icon: AlertIcon },
        { href: "/admin/schedules", label: t.schedules, icon: ClockIcon },
        { href: "/admin/templates", label: t.templates, icon: TagIcon },
      ],
    },
    {
      label: t.structure,
      entries: [
        { href: "/admin/categories", label: t.categories, icon: TagIcon },
        { href: "/admin/sessions", label: t.sessions, icon: CalendarIcon },
        { href: "/admin/teams", label: t.teams, icon: UsersIcon },
        { href: "/admin/checklists", label: t.checklists, icon: CheckIcon },
        { href: "/admin/checklist-tasks", label: t.checklistTasks, icon: CheckIcon },
      ],
    },
    {
      label: t.team,
      entries: [
        { href: "/admin/users", label: t.users, icon: UserIcon },
        { href: "/admin/roles", label: t.roles, icon: UserIcon },
      ],
    },
    {
      label: t.tools,
      entries: [
        { href: "/admin/deliveries", label: t.deliveries, icon: SendIcon },
        { href: "/admin/analytics", label: t.analytics, icon: BarChartIcon },
        { href: "/admin/audit", label: t.auditLog, icon: ClockIcon },
        { href: "/admin/branding", label: t.branding, icon: BrushIcon },
      ],
    },
    {
      label: t.help,
      entries: [{ href: "/admin/aide", label: t.guides, icon: SparkleIcon }],
    },
  ];
}

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const nav = getNav(t.nav);

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-20 space-y-6">
        {nav.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
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
                          ? "bg-brand-100 font-semibold text-brand-900 ring-2 ring-brand-300 shadow-sm dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-700"
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={active ? "text-brand-700 dark:text-brand-400" : "text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-300"}
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
  const { t } = useTranslation();
  const nav = getNav(t.nav);
  const [open, setOpen] = useState(false);

  const allEntries = nav.flatMap((s) => s.entries);
  const current = allEntries.find((e) => isActive(e.href, pathname)) ?? allEntries[0];
  const CurrentIcon = current.icon;

  return (
    <nav className="lg:hidden -mx-4 mb-4 border-b border-neutral-200 bg-neutral-50/80 px-4 sm:-mx-6 sm:px-6 dark:border-neutral-700 dark:bg-neutral-800/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        <span className="flex items-center gap-2">
          <CurrentIcon size={16} className="text-brand-600 dark:text-brand-400" />
          {current.label}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="pb-3 space-y-3">
          {nav.map((section) => (
            <div key={section.label}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {section.label}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {section.entries.map((entry) => {
                  const Icon = entry.icon;
                  const active = isActive(entry.href, pathname);
                  return (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition ${
                        active
                          ? "bg-brand-100 font-medium text-brand-900 dark:bg-brand-900/30 dark:text-brand-300"
                          : "text-neutral-600 active:bg-neutral-200 dark:text-neutral-400 dark:active:bg-neutral-700"
                      }`}
                    >
                      <Icon size={15} className={active ? "text-brand-600 dark:text-brand-400" : "text-neutral-400"} />
                      <span className="truncate">{entry.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}
