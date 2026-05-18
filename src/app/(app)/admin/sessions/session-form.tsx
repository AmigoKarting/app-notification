"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Field, FormError, SelectField, toDatetimeLocal } from "@/components/ui";
import {
  createSessionAction,
  updateSessionAction,
} from "@/domain/sessions/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { AppSession } from "@/domain/sessions/repository";
import { useTranslation } from "@/lib/i18n";

type CategoryOption = { id: string; name: string };

type Props =
  | { mode: "create"; categories: CategoryOption[] }
  | { mode: "edit"; categories: CategoryOption[]; session: AppSession };

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? savingLabel : label}
    </Button>
  );
}

export function SessionForm(props: Props) {
  const { t } = useTranslation();
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
        label={t.feedForm.category}
        name="category_id"
        defaultValue={initial?.category_id ?? ""}
        required
        error={errors?.category_id}
      >
        <option value="" disabled>
          {t.adminSessions.selectCategory}
        </option>
        {props.categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>

      <Field
        label={t.adminSessions.slug}
        name="slug"
        defaultValue={initial?.slug ?? ""}
        required
        hint={t.adminSessions.slugHint}
        error={errors?.slug}
      />
      <Field
        label={t.adminSessions.sessionName}
        name="name"
        defaultValue={initial?.name ?? ""}
        required
        hint={t.adminSessions.sessionNameHint}
        error={errors?.name}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label={t.adminSessions.start}
          name="starts_at"
          type="datetime-local"
          defaultValue={initial?.starts_at ? toDatetimeLocal(initial.starts_at) : ""}
          required
          error={errors?.starts_at}
        />
        <Field
          label={t.adminSessions.end}
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
        {t.adminSessions.isActive}
      </label>

      {state.status === "error" && !errors && <FormError message={state.message} />}
      {state.status === "success" && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <SubmitButton label={props.mode === "create" ? t.common.create : t.common.save} savingLabel={t.common.saving} />
      </div>
    </form>
  );
}
