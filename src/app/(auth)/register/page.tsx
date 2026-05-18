import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { getServerDictionary } from "@/lib/i18n/server";

export default function RegisterPage() {
  const t = getServerDictionary();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t.authPages.registerTitle}</h1>
        <p className="text-sm text-neutral-600">
          {t.authPages.registerSubtitle}
        </p>
      </header>

      <SignupForm />

      <p className="text-sm text-neutral-600">
        {t.authPages.alreadyHaveAccount}{" "}
        <Link href="/login" className="font-medium text-neutral-900 hover:underline">
          {t.authPages.loginLink}
        </Link>
      </p>
    </div>
  );
}
