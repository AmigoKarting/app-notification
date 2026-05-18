"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { ConfirmModal } from "@/components/confirm-modal";
import { deleteTemplateAction } from "@/domain/templates/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteTemplateForm({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <form ref={formRef} action={deleteTemplateAction}>
        <input type="hidden" name="id" value={id} />
        <Button type="button" variant="danger" onClick={() => setShowModal(true)}>
          {t.dangerZone.deleteBtn}
        </Button>
      </form>

      <ConfirmModal
        open={showModal}
        title={`${t.dangerZone.confirmDeleteTemplate} "${name}" ?`}
        confirmLabel={t.dangerZone.deleteBtn}
        onConfirm={() => {
          setShowModal(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
