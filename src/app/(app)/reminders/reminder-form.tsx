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

type EmployeeOption = { id: string; name: string };

type Props =
  | { mode: "create"; employees: EmployeeOption[] }
  | { mode: "edit"; employees: EmployeeOption[]; reminder: Reminder };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

export function ReminderForm(props: Props) {
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
        label="Employé"
        name="employee_id"
        defaultValue={initial?.employee_id ?? ""}
        required
        error={errors?.employee_id}
      >
        <option value="" disabled>
          Sélectionner un employé...
        </option>
        {props.employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </SelectField>

      <TextAreaField
        label="Message"
        name="message"
        rows={4}
        defaultValue={initial?.message ?? ""}
        required
        maxLength={2000}
        error={errors?.message}
      />

      <Field
        label="Date et heure d'envoi"
        name="scheduled_at"
        type="datetime-local"
        defaultValue={initialDate}
        required
        error={errors?.scheduled_at}
      />

      {props.mode === "edit" && (
        <SelectField
          label="Statut"
          name="status"
          defaultValue={initial?.status ?? "pending"}
          error={errors?.status}
        >
          <option value="pending">En attente</option>
          <option value="sent">Envoyé</option>
          <option value="cancelled">Annulé</option>
          <option value="failed">Échec</option>
        </SelectField>
      )}

      {state.status === "error" && !errors && <FormError message={state.message} />}
      {state.status === "success" && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <SubmitButton label={props.mode === "create" ? "Créer le rappel" : "Enregistrer"} />
      </div>
    </form>
  );
}
