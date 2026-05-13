"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Field, FormError } from "@/components/ui";
import { createTeamAction, updateTeamAction } from "@/domain/teams/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { Team } from "@/domain/teams/repository";

const PRESET_COLORS = [
  "#6b7280", "#dc2626", "#ea580c", "#ca8a04",
  "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#db2777",
];

type Props = { mode: "create" } | { mode: "edit"; team: Team };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

export function TeamForm(props: Props) {
  const action =
    props.mode === "create"
      ? createTeamAction
      : updateTeamAction.bind(null, props.team.id);

  const [state, formAction] = useFormState<FormState<Team>, FormData>(
    action,
    idleFormState as FormState<Team>,
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const initial = props.mode === "edit" ? props.team : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field
        label="Slug"
        name="slug"
        defaultValue={initial?.slug ?? ""}
        required
        hint="Identifiant technique. Ex: 'commerciaux', 'tech'"
        error={errors?.slug}
      />
      <Field
        label="Nom de l'équipe"
        name="name"
        defaultValue={initial?.name ?? ""}
        required
        error={errors?.name}
      />

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-neutral-800">Couleur</legend>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                defaultChecked={(initial?.color ?? "#6b7280") === c}
                className="peer sr-only"
              />
              <span
                className="block h-8 w-8 rounded-full ring-2 ring-transparent transition peer-checked:ring-neutral-900"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
        {errors?.color && <p className="mt-1 text-xs text-red-600">{errors.color}</p>}
      </fieldset>

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
