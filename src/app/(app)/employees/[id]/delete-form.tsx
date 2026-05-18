"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { ConfirmModal } from "@/components/confirm-modal";
import { deleteEmployeeAction } from "@/domain/employees/actions";
import { useTranslation } from "@/lib/i18n";

export function DeleteEmployeeForm({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <form ref={formRef} action={deleteEmployeeAction}>
        <input type="hidden" name="id" value={id} />
        <Button type="button" variant="danger" onClick={() => setShowModal(true)}>
          {t.employees.deleteBtn}
        </Button>
      </form>

      <ConfirmModal
        open={showModal}
        title={t.employees.deleteConfirm.replace("{name}", name)}
        confirmLabel={t.employees.deleteBtn}
        onConfirm={() => {
          setShowModal(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
