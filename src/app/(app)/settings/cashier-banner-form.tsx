"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { Button, Field, FormError } from "@/components/ui";
import { updateCashierBannerAction } from "@/domain/branding/actions";
import { type FormState } from "@/domain/form-state";
import { useTranslation } from "@/lib/i18n";

interface Props {
  initialEnabled: boolean;
  initialMessage: string | null;
  initialCta: string | null;
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  const { t } = useTranslation();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.common.saving : t.common.save}
    </Button>
  );
}

export function CashierBannerForm({ initialEnabled, initialMessage, initialCta }: Props) {
  const { t } = useTranslation();
  const [state, formAction] = useFormState<FormState<unknown>, FormData>(
    updateCashierBannerAction as unknown as (
      prev: FormState<unknown>,
      formData: FormData,
    ) => Promise<FormState<unknown>>,
    { status: "idle" },
  );

  // État local pour le live preview
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState(initialMessage ?? "");
  const [cta, setCta] = useState(initialCta ?? "");

  const previewMessage = message.trim() || t.checklist.bannerTitle;
  const previewCta = cta.trim() || t.checklist.bannerCta;

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <span>
          <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {t.settings.cashierBannerEnabled}
          </span>
          <span className="block text-xs text-neutral-500 dark:text-neutral-400">
            {t.settings.cashierBannerEnabledHint}
          </span>
        </span>
        <input
          type="checkbox"
          name="cashier_banner_enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-5 w-5 cursor-pointer rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
        />
      </label>

      <Field
        label={t.settings.cashierBannerMessage}
        name="cashier_banner_message"
        type="text"
        maxLength={160}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        hint={t.settings.cashierBannerMessageHint}
        error={
          state.status === "error" ? state.fieldErrors?.cashier_banner_message : undefined
        }
      />

      <Field
        label={t.settings.cashierBannerCta}
        name="cashier_banner_cta"
        type="text"
        maxLength={40}
        value={cta}
        onChange={(e) => setCta(e.target.value)}
        hint={t.settings.cashierBannerCtaHint}
        error={state.status === "error" ? state.fieldErrors?.cashier_banner_cta : undefined}
      />

      {/* Aperçu live */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {t.settings.cashierBannerPreview}
        </p>
        {enabled ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
                <span className="text-base">📋</span>
                <span>{previewMessage}</span>
              </p>
              <span className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white">
                {previewCta}
              </span>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-2.5 text-xs italic text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {t.settings.cashierBannerEnabledHint}
          </p>
        )}
      </div>

      {state.status === "error" && <FormError message={state.message} />}
      {state.status === "success" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {state.message ?? t.settings.cashierBannerSaved}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitBtn />
      </div>
    </form>
  );
}
