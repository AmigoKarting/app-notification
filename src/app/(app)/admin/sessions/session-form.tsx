"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Field, FormError, SelectField, toDatetimeLocal } from "@/components/ui";
import {
  createSessionAction,
  updateSessionAction,
} from "@/domain/sessions/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { AppSession } from "@/domain/sessions/repository";

type CategoryOption = { id: string; name: string };

type Props =
  | { mode: "create"; categories: CategoryOption[] }
  | { mode: "edit"; categories: CategoryOption[]; session: AppSession };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

export function SessionForm(props: Props) {
  const action =
    props.mode === "create"
      ? createSessionAction
      : updateSessionAction.bind(null, props.session.id);

  const [state, formAction] = useFormState<FormState<AppSession>, FormData>(
    action,
    idleFormState as FormState<AppSession>,
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const initial = props.mode === "edit" ? props.session : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <SelectField
        label="Catégorie"
        name="category_id"
        defaultValue={initial?.category_id ?? ""}
        required
        error={errors?.category_id}
      >
        <option value="" disabled>
          Sélectionner une catégorie...
        </option>
        {props.categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>

      <Field
        label="Slug"
        name="slug"
        defaultValue={initial?.slug ?? ""}
        required
        hint="Identifiant technique. Ex: 'ete-2026'"
        error={errors?.slug}
      />
      <Field
        label="Nom de la session"
        name="name"
        defaultValue={initial?.name ?? ""}
        required
        hint="Ex: Été 2026, Onboarding semaine 1"
        error={errors?.name}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Début"
          name="starts_at"
          type="datetime-local"
          defaultValue={initial?.starts_at ? toDatetimeLocal(initial.starts_at) : ""}
          required
          error={errors?.starts_at}
        />
        <Field
          label="Fin"
          name="ends_at"
          type="datetime-local"
          defaultValue={initial?.ends_at ? toDatetimeLocal(initial.ends_at) : ""}
          required
          error={errors?.ends_at}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={initial?.is_active ?? true}
          className="h-4 w-4 rounded border-neutral-300"
        />
        Session active (les notifications liées s'envoient pendant la période)
      </label>

      {state.status === "error" && !errors && <FormError message={state.message} />}
      {state.status === "success" && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <SubmitButton label={props.mode === "create" ? "Créer" : "Enregistrer"} />
      </div>
    </form>
  );
}
