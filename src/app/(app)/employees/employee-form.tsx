"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Field, FormError } from "@/components/ui";
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/domain/employees/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { Employee } from "@/domain/employees/repository";

type Props = { mode: "create" } | { mode: "edit"; employee: Employee };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

export function EmployeeForm(props: Props) {
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
        label="Nom"
        name="name"
        defaultValue={initial?.name ?? ""}
        autoComplete="name"
        required
        maxLength={120}
        error={errors?.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={initial?.email ?? ""}
        autoComplete="email"
        required
        error={errors?.email}
      />
      <Field
        label="Téléphone"
        name="phone"
        type="tel"
        defaultValue={initial?.phone ?? ""}
        autoComplete="tel"
        hint="Optionnel"
        error={errors?.phone}
      />

      {state.status === "error" && !errors && <FormError message={state.message} />}
      {state.status === "success" && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <SubmitButton label={props.mode === "create" ? "Créer l'employé" : "Enregistrer"} />
      </div>
    </form>
  );
}
