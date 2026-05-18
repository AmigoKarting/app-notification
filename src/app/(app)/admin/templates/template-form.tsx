"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  Button,
  Field,
  FormError,
  SelectField,
  TextAreaField,
} from "@/components/ui";
import {
  createTemplateAction,
  updateTemplateAction,
} from "@/domain/templates/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { Template } from "@/domain/templates/repository";
import { FormattingHelp } from "@/components/form-hints";
import { useTranslation } from "@/lib/i18n";

type Option = { id: string; name: string };

type Props =
  | { mode: "create"; categories: Option[] }
  | { mode: "edit"; categories: Option[]; template: Template };

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? savingLabel : label}
    </Button>
  );
}

export function TemplateForm(props: Props) {
  const { t } = useTranslation();
  const action =
    props.mode === "create"
      ? createTemplateAction
      : updateTemplateAction.bind(null, props.template.id);

  const [state, formAction] = useFormState<FormState<Template>, FormData>(
    action,
    idleFormState as FormState<Template>,
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const initial = props.mode === "edit" ? props.template : null;
  const initialChannels = new Set(initial?.send_channels ?? []);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field
        label={t.adminTemplates.templateName}
        name="name"
        defaultValue={initial?.name ?? ""}
        required
        maxLength={80}
        placeholder={t.adminTemplates.templateNamePlaceholder}
        hint={t.adminTemplates.templateNameHint}
        error={errors?.name}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label={t.adminTemplates.type}
          name="kind"
          defaultValue={initial?.kind ?? "notification"}
        >
          <option value="notification">{t.feed.notification}</option>
          <option value="reminder">{t.feed.reminder}</option>
        </SelectField>
        <SelectField
          label={t.adminTemplates.priority}
          name="priority"
          defaultValue={initial?.priority ?? "normal"}
        >
          <option value="low">{t.adminTemplates.priorityLow}</option>
          <option value="normal">{t.adminTemplates.priorityNormal}</option>
          <option value="high">{t.adminTemplates.priorityHigh}</option>
        </SelectField>
      </div>

      <Field
        label={t.adminTemplates.titleField}
        name="title"
        defaultValue={initial?.title ?? ""}
        required
        maxLength={160}
        placeholder={t.adminTemplates.titlePlaceholder}
        error={errors?.title}
      />
      <TextAreaField
        label={t.adminTemplates.message}
        name="body"
        rows={5}
        defaultValue={initial?.body ?? ""}
        maxLength={5000}
        placeholder={t.adminTemplates.messagePlaceholder}
      />
      <FormattingHelp />

      <SelectField
        label={t.adminTemplates.defaultCategory}
        name="category_id"
        defaultValue={initial?.category_id ?? ""}
      >
        <option value="">{t.adminTemplates.noneCategory}</option>
        {props.categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label={t.adminTemplates.actionLabel}
          name="action_label"
          defaultValue={initial?.action_label ?? ""}
          maxLength={60}
          placeholder={t.adminTemplates.actionLabelPlaceholder}
        />
        <Field
          label={t.adminTemplates.actionUrl}
          name="action_url"
          type="url"
          defaultValue={initial?.action_url ?? ""}
          placeholder="https://…"
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-neutral-800">
          {t.adminTemplates.defaultChannels}
        </p>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="checkbox"
              name="send_channels"
              value="email"
              defaultChecked={initialChannels.has("email")}
              className="peer sr-only"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-800">
              📧 Email
            </span>
          </label>
          <label className="cursor-pointer">
            <input
              type="checkbox"
              name="send_channels"
              value="sms"
              defaultChecked={initialChannels.has("sms")}
              className="peer sr-only"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-800">
              💬 SMS
            </span>
          </label>
        </div>
      </div>

      {state.status === "error" && !errors && <FormError message={state.message} />}
      {state.status === "success" && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <SubmitButton
          label={props.mode === "create" ? t.adminTemplates.createBtn : t.common.save}
          savingLabel={t.common.saving}
        />
      </div>
    </form>
  );
}
