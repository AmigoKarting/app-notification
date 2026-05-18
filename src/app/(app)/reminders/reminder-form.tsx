"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  Button,
  FormError,
  SelectField,
  TextAreaField,
  Field,
  toDatetimeLocal,
} from "@/components/ui";
import {
  createReminderAction,
  updateReminderAction,
} from "@/domain/reminders/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { Reminder } from "@/domain/reminders/repository";
import { useTranslation } from "@/lib/i18n";

type EmployeeOption = { id: string; name: string };

type Props =
  | { mode: "create"; employees: EmployeeOption[] }
  | { mode: "edit"; employees: EmployeeOption[]; reminder: Reminder };

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? savingLabel : label}
    </Button>
  );
}

export function ReminderForm(props: Props) {
  const { t } = useTranslation();
  const action =
    props.mode === "create"
      ? createReminderAction
      : updateReminderAction.bind(null, props.reminder.id);

  const [state, formAction] = useFormState<FormState<Reminder>, FormData>(
    action,
    idleFormState as FormState<Reminder>,
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  const initial = props.mode === "edit" ? props.reminder : null;
  const initialDate = initial ? toDatetimeLocal(initial.scheduled_at) : "";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <SelectField
        label={t.reminders.employee}
        name="employee_id"
        defaultValue={initial?.employee_id ?? ""}
        required
        error={errors?.employee_id}
      >
        <option value="" disabled>
          {t.reminders.selectEmployee}
        </option>
        {props.employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </SelectField>

      <TextAreaField
        label={t.reminders.messageLabel}
        name="message"
        rows={4}
        defaultValue={initial?.message ?? ""}
        required
        maxLength={2000}
        error={errors?.message}
      />

      <Field
        label={t.reminders.scheduledAt}
        name="scheduled_at"
        type="datetime-local"
        defaultValue={initialDate}
        required
        error={errors?.scheduled_at}
      />

      {props.mode === "edit" && (
        <SelectField
          label={t.reminders.status}
          name="status"
          defaultValue={initial?.status ?? "pending"}
          error={errors?.status}
        >
          <option value="pending">{t.reminders.statusPending}</option>
          <option value="sent">{t.reminders.statusSent}</option>
          <option value="cancelled">{t.reminders.statusCancelled}</option>
          <option value="failed">{t.reminders.statusFailed}</option>
        </SelectField>
      )}

      {state.status === "error" && !errors && <FormError message={state.message} />}
      {state.status === "success" && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <SubmitButton
          label={props.mode === "create" ? t.reminders.createBtn : t.reminders.save}
          savingLabel={t.reminders.saving}
        />
      </div>
    </form>
  );
}
