import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AppLogo, getBranding } from "@/components/app-brand";
import { getCurrentProfile } from "@/domain/auth/role";
import { getCurrentUser } from "@/domain/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    const profile = await getCurrentProfile();
    redirect(profile?.role === "dev" ? "/admin" : "/feed");
  }

  const branding = await getBranding();
  const tagline =
    branding.app_tagline ??
    "Catégories, sessions, rappels programmés et envois multi-canaux — tout au même endroit.";

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Hero gradient — desktop */}
      <aside className="bg-brand-gradient relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-2">
          <AppLogo size={40} />
          <span className="text-lg font-semibold tracking-tight">{branding.app_name}</span>
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Bienvenue sur
            <br />
            <span className="text-white/80">{branding.app_name}.</span>
          </h2>
          <p className="text-base leading-relaxed text-white/80">{tagline}</p>
          <ul className="space-y-3 text-sm">
            <Feature label="Notifications & rappels avec dates programmées" />
            <Feature label="Catégories personnalisables, codes couleur" />
            <Feature label="Sessions activables pour faire varier le contenu" />
            <Feature label="Email et SMS — extensible vers WhatsApp" />
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} {branding.app_name}
        </p>
      </aside>

      {/* Form panel */}
      <section className="bg-app-gradient flex min-h-screen items-center justify-center px-6 py-12 lg:min-h-0">
        <div className="w-full max-w-md">
          <header className="mb-8 lg:hidden">
            <div className="mb-4 flex items-center gap-2">
              <AppLogo size={30} />
              <span className="text-base font-semibold tracking-tight">{branding.app_name}</span>
            </div>
          </header>

          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Bienvenue
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Crée ton compte en quelques secondes.
            </p>
          </header>

          <div className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-soft-lg sm:p-8">
            <AuthCard defaultMode="signup" />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="text-white/90">{label}</span>
    </li>
  );
}
