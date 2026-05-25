"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FormError } from "@/components/ui";
import { submitChecklistAction } from "@/domain/checklists/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import { CHECKLIST_ITEMS } from "@/domain/checklists/items";
import { useTranslation } from "@/lib/i18n";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useTranslation();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.checklist.submitting : t.checklist.submit}
    </Button>
  );
}

export function ChecklistForm({ alreadySubmittedToday }: { alreadySubmittedToday: boolean }) {
  const { t } = useTranslation();
  const [state, formAction] = useFormState<FormState<unknown>, FormData>(
    submitChecklistAction,
    idleFormState as FormState<unknown>,
  );

  if (alreadySubmittedToday || state.status === "success") {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
        <div className="mb-2 text-3xl">✅</div>
        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
          {t.checklist.alreadyDone}
        </p>
        <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
          {t.checklist.alreadyDoneDesc}
        </p>
      </div>
    );
  }

  const sections = [
    { id: "opening" as const, label: t.checklist.sectionOpening },
    { id: "during" as const, label: t.checklist.sectionDuring },
    { id: "closing" as const, label: t.checklist.sectionClosing },
  ];

  return (
    <form action={formAction} className="space-y-6">
      {sections.map((section) => {
        const items = CHECKLIST_ITEMS.filter((i) => i.section === section.id);
        return (
          <div key={section.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              <SectionIcon section={section.id} />
              {section.label}
            </h3>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.key}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-700/50 dark:active:bg-neutral-700">
                    <input
                      type="checkbox"
                      name="items"
                      value={item.key}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 dark:border-neutral-600 dark:bg-neutral-700"
                    />
                    <span className="text-sm text-neutral-800 dark:text-neutral-200">
                      {t.checklist.items[item.key]}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t.checklist.notesLabel}
          </span>
          <textarea
            name="notes"
            rows={2}
            maxLength={500}
            placeholder={t.checklist.notesPlaceholder}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:focus:border-brand-500 dark:focus:ring-brand-900/50"
          />
        </label>
      </div>

      {state.status === "error" && <FormError message={state.message} />}

      <SubmitButton />
    </form>
  );
}

function SectionIcon({ section }: { section: "opening" | "during" | "closing" }) {
  switch (section) {
    case "opening":
      return <span>🌅</span>;
    case "during":
      return <span>☀️</span>;
    case "closing":
      return <span>🌙</span>;
  }
}
