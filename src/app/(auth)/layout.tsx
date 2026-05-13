import Link from "next/link";
import { AppLogo, getBranding } from "@/components/app-brand";
import { requireGuest } from "@/domain/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await requireGuest();
  const branding = await getBranding();

  return (
    <main className="bg-app-gradient flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 transition hover:opacity-80">
        <AppLogo size={32} />
        <span className="text-base font-semibold tracking-tight">{branding.app_name}</span>
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-7 shadow-soft-lg sm:p-8">
        {children}
      </div>
    </main>
  );
}
