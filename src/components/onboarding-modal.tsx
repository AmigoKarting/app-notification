"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

const ONBOARDING_KEY = "app-onboarding-done";

const STEP_ICONS = ["\u{1F4EC}", "\u{1F4AC}", "⚙️"];

export function OnboardingModal() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show if not already completed
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      complete();
    }
  }, [step, complete]);

  if (!open) return null;

  const steps = [
    { title: t.onboarding.step1Title, desc: t.onboarding.step1Desc },
    { title: t.onboarding.step2Title, desc: t.onboarding.step2Desc },
    { title: t.onboarding.step3Title, desc: t.onboarding.step3Desc },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-scale-in dark:bg-neutral-900 dark:shadow-black/50">
        {step === 0 && (
          <div className="mb-6 text-center">
            <p className="text-4xl">{"\u{1F44B}"}</p>
            <h2 className="mt-3 text-xl font-bold text-neutral-900 dark:text-neutral-100">{t.onboarding.welcome}</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{t.onboarding.welcomeDesc}</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-4xl">{STEP_ICONS[step]}</p>
          <h3 className="mt-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{current.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{current.desc}</p>
        </div>

        {/* Step indicators */}
        <div className="mt-6 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "bg-brand-600 w-6" : "bg-neutral-200 w-2 dark:bg-neutral-700"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={complete}
            className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {t.onboarding.skipTour}
          </button>
          <button
            onClick={nextStep}
            className="rounded-lg btn-brand-gradient px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-brand-600/30"
          >
            {step < 2 ? t.onboarding.nextStep : t.onboarding.gotIt}
          </button>
        </div>

        {/* Step counter */}
        <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
          {step + 1} {t.onboarding.stepOf} {steps.length}
        </p>
      </div>
    </div>
  );
}
