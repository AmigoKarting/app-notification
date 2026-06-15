"use client";

import { useFormStatus } from "react-dom";
import { cancelReminderAction } from "@/domain/reminders/actions";
import { useTranslation } from "@/lib/i18n";

function CancelButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-neutral-600 hover:underline disabled:opacity-50"
    >
      {pending ? "..." : label}
    </button>
  );
}

export function CancelReminderForm({ id }: { id: string }) {
  const { t } = useTranslation();
  return (
    <form
      action={cancelReminderAction}
      onSubmit={(e) => {
        if (!window.confirm(t.reminders.cancelConfirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <CancelButton label={t.reminders.cancel} />
    </form>
  );
}
