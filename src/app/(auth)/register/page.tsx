import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Créer un compte</h1>
        <p className="text-sm text-neutral-600">
          8 caractères minimum, 1 lettre + 1 chiffre.
        </p>
      </header>

      <SignupForm />

      <p className="text-sm text-neutral-600">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-neutral-900 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
