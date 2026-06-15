"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Button,
  Field,
  FormError,
  SelectField,
  TextAreaField,
  toDatetimeLocal,
} from "@/components/ui";
import {
  createFeedItemAction,
  updateFeedItemAction,
} from "@/domain/feed/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { FeedItem } from "@/domain/feed/repository";
import type { FeedTargetMode } from "@/lib/supabase/database.types";
import { FormattingHelp } from "@/components/form-hints";
import { ImageUpload } from "./image-upload";
import { BodyField } from "./body-field";
import { useTranslation } from "@/lib/i18n";

type Option = { id: string; name: string };
type UserOption = { id: string; name: string | null; email: string | null };
type TeamOption = { id: string; name: string; color: string; memberCount: number };

interface CommonProps {
  categories: Option[];
  sessions: Option[];
  teams: TeamOption[];
  users: UserOption[];
  totalUsers: number;
}

type Props =
  | (CommonProps & { mode: "create" })
  | (CommonProps & {
      mode: "edit";
      item: FeedItem;
      targets: { team_ids: string[]; user_ids: string[] };
    });

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? savingLabel : label}
    </Button>
  );
}

export function FeedItemForm(props: Props) {
  const { t } = useTranslation();
  const action =
    props.mode === "create"
      ? createFeedItemAction
      : updateFeedItemAction.bind(null, props.item.id);

  const [state, formAction] = useFormState<FormState<FeedItem>, FormData>(
    action,
    idleFormState as FormState<FeedItem>,
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const initial = props.mode === "edit" ? props.item : null;
  const initialTargets =
    props.mode === "edit" ? props.targets : { team_ids: [], user_ids: [] };

  const [targetMode, setTargetMode] = useState<FeedTargetMode>(
    initial?.target_mode ?? "all",
  );
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set(initialTargets.team_ids));
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set(initialTargets.user_ids));

  const recipientCount =
    targetMode === "all"
      ? props.totalUsers
      : targetMode === "teams"
        ? props.teams.filter((tm) => selectedTeamIds.has(tm.id)).reduce((sum, tm) => sum + tm.memberCount, 0)
        : selectedUserIds.size;

  const initialChannels = new Set(initial?.send_channels ?? []);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {/* ---- 1. Contenu ---- */}
      <section className="space-y-4">
        <Field
          label={t.feedForm.title}
          name="title"
          defaultValue={initial?.title ?? ""}
          required
          maxLength={160}
          placeholder={t.feedForm.titlePlaceholder}
          error={errors?.title}
        />

        <BodyField
          defaultValue={initial?.body ?? ""}
          maxLength={5000}
          placeholder={t.feedForm.bodyPlaceholder}
        />
        <FormattingHelp />

        <ImageUpload initialUrl={initial?.image_url} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={t.feedForm.actionLabel}
            name="action_label"
            defaultValue={initial?.action_label ?? ""}
            maxLength={60}
            placeholder={t.feedForm.actionLabelPlaceholder}
            hint={t.feedForm.actionLabelHint}
            error={errors?.action_label}
          />
          <Field
            label={t.feedForm.actionUrl}
            name="action_url"
            type="url"
            defaultValue={initial?.action_url ?? ""}
            placeholder={t.feedForm.actionUrlPlaceholder}
            hint={t.feedForm.actionUrlHint}
            error={errors?.action_url}
          />
        </div>
      </section>

      {/* ---- 1.5. Diffusion (épinglé / brouillon / canaux externes) ---- */}
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5 dark:border-neutral-700 dark:bg-neutral-800/40">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.feedForm.broadcasting}</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {t.feedForm.broadcastingDesc}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleOption
            name="is_draft"
            defaultChecked={initial?.is_draft ?? false}
            label={t.feedForm.isDraft}
            description={t.feedForm.isDraftDesc}
          />
          <ToggleOption
            name="is_pinned"
            defaultChecked={initial?.is_pinned ?? false}
            label={t.feedForm.isPinned}
            description={t.feedForm.isPinnedDesc}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-800">
            {t.feedForm.sendAlsoBy}
          </p>
          <p className="mb-2 text-xs text-neutral-500">
            {t.feedForm.sendAlsoByDesc}
          </p>
          <div className="flex flex-wrap gap-2">
            <ChannelCheckbox
              name="send_channels"
              value="email"
              defaultChecked={initialChannels.has("email")}
              label="📧 Email"
            />
            <ChannelCheckbox
              name="send_channels"
              value="sms"
              defaultChecked={initialChannels.has("sms")}
              label="💬 SMS"
            />
            <ChannelCheckbox
              name="send_channels"
              value="push"
              defaultChecked={props.mode === "create" || initialChannels.has("push")}
              label="🔔 Push"
            />
          </div>
        </div>
      </section>

      {/* ---- 2. Destinataires ---- */}
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5 dark:border-neutral-700 dark:bg-neutral-800/40">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.feedForm.recipients}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">{t.feedForm.recipientsQuestion}</p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
            {recipientCount} {t.feedForm.recipientCount}
          </span>
        </header>

        <fieldset className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <TargetRadio
            mode={targetMode}
            value="all"
            onChange={setTargetMode}
            title={t.feedForm.everyone}
            description={t.feedForm.everyoneDesc}
          />
          <TargetRadio
            mode={targetMode}
            value="teams"
            onChange={setTargetMode}
            title={t.feedForm.selectedTeams}
            description={t.feedForm.selectedTeamsDesc}
          />
          <TargetRadio
            mode={targetMode}
            value="users"
            onChange={setTargetMode}
            title={t.feedForm.selectedUsers}
            description={t.feedForm.selectedUsersDesc}
          />
        </fieldset>

        {targetMode === "teams" && (
          <PickerList
            label={t.feedForm.teams}
            error={errors?.target_team_ids}
            emptyMessage={t.feedForm.noTeams}
            items={props.teams.map((tm) => ({
              id: tm.id,
              primary: tm.name,
              accentColor: tm.color,
            }))}
            name="target_team_ids"
            initialSelected={initialTargets.team_ids}
            onSelectionChange={setSelectedTeamIds}
          />
        )}

        {targetMode === "users" && (
          <PickerList
            label={t.feedForm.users}
            error={errors?.target_user_ids}
            emptyMessage={t.feedForm.noUsers}
            items={props.users.map((u) => ({
              id: u.id,
              primary: u.name?.trim() || u.email || t.common.noName,
              secondary: u.name ? u.email ?? undefined : undefined,
            }))}
            name="target_user_ids"
            initialSelected={initialTargets.user_ids}
            searchable
            onSelectionChange={setSelectedUserIds}
          />
        )}
      </section>

      {/* ---- 3. Classement (catégorie, période, priorité, type) ---- */}
      <section className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5 dark:border-neutral-700 dark:bg-neutral-800/40">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.feedForm.classification}</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {t.feedForm.classificationDesc}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label={t.feedForm.type}
            name="kind"
            defaultValue={initial?.kind ?? "notification"}
            required
            hint={t.feedForm.typeHint}
          >
            <option value="notification">{t.feedForm.notificationType}</option>
            <option value="reminder">{t.feedForm.reminderType}</option>
          </SelectField>

          <SelectField
            label={t.feedForm.priority}
            name="priority"
            defaultValue={initial?.priority ?? "normal"}
          >
            <option value="low">{t.feedForm.priorityLow}</option>
            <option value="normal">{t.feedForm.priorityNormal}</option>
            <option value="high">{t.feedForm.priorityHigh}</option>
          </SelectField>

          <SelectField
            label={t.feedForm.category}
            name="category_id"
            defaultValue={initial?.category_id ?? ""}
            hint={t.feedForm.categoryHint}
          >
            <option value="">{t.feedForm.noneCategory}</option>
            {props.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label={t.feedForm.period}
            name="session_id"
            defaultValue={initial?.session_id ?? ""}
            hint={t.feedForm.periodHint}
          >
            <option value="">{t.feedForm.alwaysVisible}</option>
            {props.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        </div>
      </section>

      {/* ---- 4. Dates ---- */}
      <section className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5 dark:border-neutral-700 dark:bg-neutral-800/40">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.feedForm.dates}</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {t.feedForm.datesDesc}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field
            label={t.feedForm.publishAt}
            name="published_at"
            type="datetime-local"
            defaultValue={initial?.published_at ? toDatetimeLocal(initial.published_at) : ""}
            hint={t.feedForm.publishAtHint}
          />
          <Field
            label={t.feedForm.hideAfter}
            name="expires_at"
            type="datetime-local"
            defaultValue={initial?.expires_at ? toDatetimeLocal(initial.expires_at) : ""}
            hint={t.feedForm.hideAfterHint}
          />
          <Field
            label={t.feedForm.dueDate}
            name="due_date"
            type="datetime-local"
            defaultValue={initial?.due_date ? toDatetimeLocal(initial.due_date) : ""}
            hint={t.feedForm.dueDateHint}
            error={errors?.due_date}
          />
        </div>
      </section>

      {state.status === "error" && !errors && <FormError message={state.message} />}
      {state.status === "success" && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <SubmitButton label={props.mode === "create" ? t.common.publish : t.common.save} savingLabel={t.common.saving} />
      </div>
    </form>
  );
}

function ToggleOption({
  name,
  defaultChecked,
  label,
  description,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 hover:border-neutral-300">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="flex-1">
        <span className="block text-sm font-medium text-neutral-900">{label}</span>
        <span className="block text-xs text-neutral-500">{description}</span>
      </span>
    </label>
  );
}

function ChannelCheckbox({
  name,
  value,
  defaultChecked,
  label,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  label: string;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-800">
        {label}
      </span>
    </label>
  );
}

function TargetRadio({
  mode,
  value,
  onChange,
  title,
  description,
}: {
  mode: FeedTargetMode;
  value: FeedTargetMode;
  onChange: (m: FeedTargetMode) => void;
  title: string;
  description: string;
}) {
  const active = mode === value;
  return (
    <label
      className={`cursor-pointer rounded-lg border bg-white p-3 transition ${
        active
          ? "border-brand-500 ring-2 ring-brand-100"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <input
        type="radio"
        name="target_mode"
        value={value}
        checked={active}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
    </label>
  );
}

interface PickerItem {
  id: string;
  primary: string;
  secondary?: string;
  accentColor?: string;
}

function PickerList({
  label,
  items,
  name,
  initialSelected,
  error,
  emptyMessage,
  searchable = false,
  onSelectionChange,
}: {
  label: string;
  items: PickerItem[];
  name: string;
  initialSelected: string[];
  error?: string;
  emptyMessage: string;
  searchable?: boolean;
  onSelectionChange?: (selected: Set<string>) => void;
}) {
  const [search, setSearch] = useState("");
  const initial = new Set(initialSelected);
  const [selected, setSelected] = useState(initial);

  function handleToggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      onSelectionChange?.(next);
      return next;
    });
  }

  const { t } = useTranslation();
  const filtered =
    searchable && search
      ? items.filter((i) => {
          const q = search.toLowerCase();
          return (
            i.primary.toLowerCase().includes(q) ||
            (i.secondary?.toLowerCase().includes(q) ?? false)
          );
        })
      : items;

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-neutral-800">{label}</p>
      {searchable && items.length > 0 && (
        <input
          type="search"
          placeholder={t.common.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      )}
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-6 text-center text-sm text-neutral-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">{t.common.noResults}</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {filtered.map((i) => (
                <li key={i.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      name={name}
                      value={i.id}
                      checked={selected.has(i.id)}
                      onChange={(e) => handleToggle(i.id, e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    />
                    {i.accentColor && (
                      <span
                        className="block h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: i.accentColor }}
                      />
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-sm text-neutral-900">
                        {i.primary}
                      </span>
                      {i.secondary && (
                        <span className="block truncate text-xs text-neutral-500">
                          {i.secondary}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
