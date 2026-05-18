"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Field, FormError } from "@/components/ui";
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/domain/employees/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { Employee } from "@/domain/employees/repository";
import { useTranslation } from "@/lib/i18n";

type Props = { mode: "create" } | { mode: "edit"; employee: Employee };

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? savingLabel : label}
    </Button>
  );
}

export function EmployeeForm(props: Props) {
  const { t } = useTranslation();
  const action =
    props.mode === "create"
      ? createEmployeeAction
      : updateEmployeeAction.bind(null, props.employee.id);

  const [state, formAction] = useFormState<FormState<Employee>, FormData>(
    action,
    idleFormState as FormState<Employee>,
  );

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const initial = props.mode === "edit" ? props.employee : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field
        label={t.employees.name}
        name="name"
        defaultValue={initial?.name ?? ""}
        autoComplete="name"
        required
        maxLength={120}
        error={errors?.name}
      />
      <Field
        label={t.employees.email}
        name="email"
        type="email"
        defaultValue={initial?.email ?? ""}
        autoComplete="email"
        required
        error={errors?.email}
      />
      <Field
        label={t.employees.phone}
        name="phone"
        type="tel"
        defaultValue={initial?.phone ?? ""}
        autoComplete="tel"
        hint={t.employees.phoneHint}
        error={errors?.phone}
      />

      {state.status === "error" && !errors && <FormError message={state.message} />}
      {state.status === "success" && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <SubmitButton
          label={props.mode === "create" ? t.employees.createEmployee : t.employees.save}
          savingLabel={t.employees.saving}
        />
      </div>
    </form>
  );
}
