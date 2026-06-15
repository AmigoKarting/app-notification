"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { ConfirmModal } from "@/components/confirm-modal";
import { deleteReminderAction } from "@/domain/reminders/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteReminderForm({ id }: { id: string }) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <form ref={formRef} action={deleteReminderAction}>
        <input type="hidden" name="id" value={id} />
        <Button type="button" variant="danger" onClick={() => setShowModal(true)}>
          {t.reminders.deleteBtn}
        </Button>
      </form>

      <ConfirmModal
        open={showModal}
        title={t.reminders.deleteConfirm}
        confirmLabel={t.reminders.deleteBtn}
        onConfirm={() => {
          setShowModal(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
