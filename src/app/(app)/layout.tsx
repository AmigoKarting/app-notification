import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppLogo, getBranding } from "@/components/app-brand";
import { LanguageToggle } from "@/components/language-toggle";
import { logoutAction } from "@/domain/auth/actions";
import { getCurrentProfile } from "@/domain/auth/role";
import { requireUser } from "@/domain/auth/session";
import { OnboardingModal } from "@/components/onboarding-modal";
import { getServerDictionary } from "@/lib/i18n/server";

const DEV_ONLY_PREFIXES = ["/dashboard", "/employees", "/reminders", "/admin"];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const t = getServerDictionary();

  let profile: Awaited<ReturnType<typeof getCurrentProfile>> = null;
  try {
    profile = await getCurrentProfile();
  } catch (e) {
    console.error("[LAYOUT] getCurrentProfile error:", e);
  }

  let branding: { app_name: string; app_tagline: string | null; logo_url: string | null };
  try {
    branding = await getBranding();
  } catch (e) {
    console.error("[LAYOUT] getBranding error:", e);
    branding = { app_name: "App Notification", app_tagline: null, logo_url: null };
  }

  const isDev = profile?.role === "dev";
  const displayLabel =
    (profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.display_name?.trim()) || user.email || "";

  const pathname = headers().get("x-pathname") ?? "";
  if (!isDev && DEV_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    redirect("/feed");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href={isDev ? "/admin" : "/feed"}
              className="mr-3 flex items-center gap-2 font-semibold tracking-tight"
            >
              <AppLogo size={28} />
              <span className="hidden sm:inline">{branding.app_name}</span>
            </Link>

            <NavLink href="/feed" label={t.nav.notifications} />
            {isDev && (
              <Link
                href="/admin"
                className="ml-2 inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-100 hover:text-brand-800"
              >
                {t.nav.admin}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 text-sm">
            <LanguageToggle />
            {isDev && (
              <Link
                href="/admin/aide"
                title={t.nav.helpTooltip}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-brand-700"
                aria-label={t.nav.help}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </Link>
            )}
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
              title={user.email ?? undefined}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white shadow-sm">
                {displayLabel.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden font-medium sm:inline">{displayLabel}</span>
            </Link>
            {profile && isDev && (
              <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200 sm:inline">
                {profile.role}
              </span>
            )}
            <form action={logoutAction}>
              <button className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50">
                {t.auth.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <OnboardingModal />
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
    >
      {label}
    </Link>
  );
}
