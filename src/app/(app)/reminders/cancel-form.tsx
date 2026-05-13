"use client";

import { useFormStatus } from "react-dom";
import { cancelReminderAction } from "@/domain/reminders/actions";

function CancelButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-neutral-600 hover:underline disabled:opacity-50"
    >
      {pending ? "..." : "Annuler"}
    </button>
  );
}

export function CancelReminderForm({ id }: { id: string }) {
  return (
    <form
      action={cancelReminderAction}
      onSubmit={(e) => {
        if (!window.confirm("Annuler ce rappel ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <CancelButton />
    </form>
  );
}
