import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <p className="text-sm text-neutral-600">Accédez à votre tableau de bord.</p>
      </header>

      <LoginForm />

      <p className="text-sm text-neutral-600">
        Pas de compte ?{" "}
        <Link href="/register" className="font-medium text-neutral-900 hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
