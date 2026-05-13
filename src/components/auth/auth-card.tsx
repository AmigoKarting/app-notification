"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

type Mode = "signup" | "login";

export function AuthCard({ defaultMode = "signup" }: { defaultMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(defaultMode);

  return (
    <div>
      <div role="tablist" className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => setMode("signup")}
          className={`rounded-md py-2 text-sm font-medium transition-all duration-200 ${
            mode === "signup"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Créer un compte
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => setMode("login")}
          className={`rounded-md py-2 text-sm font-medium transition-all duration-200 ${
            mode === "login"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Se connecter
        </button>
      </div>

      {mode === "signup" ? <SignupForm key="signup" /> : <LoginForm key="login" />}

      <p className="mt-6 text-center text-xs text-neutral-500">
        {mode === "signup" ? (
          <>
            Déjà un compte ?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
            >
              Se connecter
            </button>
          </>
        ) : (
          <>
            Pas encore inscrit ?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="font-medium text-brand-700 hover:text-brand-800 hover:underline"
            >
              Créer un compte
            </button>
          </>
        )}
      </p>
    </div>
  );
}
