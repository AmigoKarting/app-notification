import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getServerDictionary } from "@/lib/i18n/server";

export default function LoginPage() {
  const t = getServerDictionary();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t.authPages.loginTitle}</h1>
        <p className="text-sm text-neutral-600">{t.authPages.loginSubtitle}</p>
      </header>

      <LoginForm />

      <p className="text-sm text-neutral-600">
        {t.authPages.noAccount}{" "}
        <Link href="/register" className="font-medium text-neutral-900 hover:underline">
          {t.authPages.registerLink}
        </Link>
      </p>
    </div>
  );
}
