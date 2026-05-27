"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Field, FormError, TextAreaField } from "@/components/ui";
import { createRoleAction, updateRoleAction } from "@/domain/roles/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import { useTranslation } from "@/lib/i18n";
import { PermissionsFieldset } from "./permissions-fieldset";

interface BaseProps {
  initialSlug?: string;
  initialName?: string;
  initialDescription?: string | null;
  initialColor?: string;
  initialIcon?: string | null;
  initialPermissions?: string[];
  /** "new" → champ slug actif. "edit" → slug en lecture seule + hidden. */
  mode: "new" | "edit";
  /** Si true → lock toutes les permissions cochées (rôle dev). */
  lockAllPermissions?: boolean;
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const { t } = useTranslation();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.common.saving : label}
    </Button>
  );
}

export function RoleForm({
  mode,
  initialSlug = "",
  initialName = "",
  initialDescription = null,
  initialColor = "#6b7280",
  initialIcon = null,
  initialPermissions = [],
  lockAllPermissions = false,
}: BaseProps) {
  const { t } = useTranslation();
  const action = mode === "new" ? createRoleAction : updateRoleAction;
  const [state, formAction] = useFormState<FormState<unknown>, FormData>(
    action as unknown as (prev: FormState<unknown>, formData: FormData) => Promise<FormState<unknown>>,
    idleFormState as FormState<unknown>,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-700 dark:bg-neutral-800">
        <h2 className="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {t.rolesAdmin.information}
        </h2>
        <div className="space-y-4">
          {mode === "new" ? (
            <Field
              label={t.rolesAdmin.slug}
              name="slug"
              type="text"
              defaultValue={initialSlug}
              required
              placeholder={t.rolesAdmin.slugPlaceholder}
              hint={t.rolesAdmin.slugHint}
              error={state.status === "error" ? state.fieldErrors?.slug : undefined}
            />
          ) : (
            <>
              <input type="hidden" name="slug" value={initialSlug} />
              <div>
                <p className="mb-1.5 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {t.rolesAdmin.slug}
                </p>
                <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 font-mono text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                  {initialSlug}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {t.rolesAdmin.slugReadOnly}
                </p>
              </div>
            </>
          )}

          <Field
            label={t.rolesAdmin.name}
            name="name"
            type="text"
            defaultValue={initialName}
            required
            maxLength={60}
            error={state.status === "error" ? state.fieldErrors?.name : undefined}
          />

          <TextAreaField
            label={t.rolesAdmin.descriptionLabel}
            name="description"
            rows={2}
            defaultValue={initialDescription ?? ""}
            maxLength={300}
            error={state.status === "error" ? state.fieldErrors?.description : undefined}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={t.rolesAdmin.color}
              name="color"
              type="color"
              defaultValue={initialColor}
              className="h-10 w-20 cursor-pointer"
              error={state.status === "error" ? state.fieldErrors?.color : undefined}
            />
            <Field
              label={t.rolesAdmin.icon}
              name="icon"
              type="text"
              defaultValue={initialIcon ?? ""}
              maxLength={4}
              placeholder="🛠️"
              hint={t.rolesAdmin.iconHint}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {t.rolesAdmin.permissions}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {lockAllPermissions
              ? t.rolesAdmin.permissionsDevLocked
              : t.rolesAdmin.permissionsDesc}
          </p>
        </div>
        <PermissionsFieldset
          initialSelected={initialPermissions}
          lockAll={lockAllPermissions}
        />
      </div>

      {state.status === "error" && <FormError message={state.message} />}
      {state.status === "success" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {state.message}
        </p>
      )}

      <div className="flex justify-end">
        <Submit label={mode === "new" ? t.rolesAdmin.createRole : t.common.save} />
      </div>
    </form>
  );
}
