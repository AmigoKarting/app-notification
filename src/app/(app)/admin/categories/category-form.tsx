"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Field, FormError } from "@/components/ui";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/domain/categories/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { Category } from "@/domain/categories/repository";

const PRESET_COLORS = [
  "#6b7280", "#dc2626", "#ea580c", "#ca8a04",
  "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#db2777",
];

type Props = { mode: "create" } | { mode: "edit"; category: Category };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

export function CategoryForm(props: Props) {
  const action =
    props.mode === "create"
      ? createCategoryAction
      : updateCategoryAction.bind(null, props.category.id);

  const [state, formAction] = useFormState<FormState<Category>, FormData>(
    action,
    idleFormState as FormState<Category>,
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const initial = props.mode === "edit" ? props.category : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field
        label="Slug"
        name="slug"
        defaultValue={initial?.slug ?? ""}
        required
        hint="Identifiant technique. Ex: 'rh', 'urgent'"
        error={errors?.slug}
      />
      <Field
        label="Nom affiché"
        name="name"
        defaultValue={initial?.name ?? ""}
        required
        error={errors?.name}
      />
      <Field
        label="Icône (emoji optionnel)"
        name="icon"
        defaultValue={initial?.icon ?? ""}
        maxLength={4}
        hint="Ex: 📢, 🚨, 🎓"
        error={errors?.icon}
      />

      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-neutral-800">Couleur</legend>
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
                className="block h-8 w-8 rounded-full ring-2 ring-transparent peer-checked:ring-neutral-900"
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
