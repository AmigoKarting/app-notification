"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Button,
  Field,
  FormError,
  SelectField,
  TextAreaField,
} from "@/components/ui";
import {
  createScheduleAction,
  previewScheduleAction,
  updateScheduleAction,
} from "@/domain/notification-schedules/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import type { Schedule } from "@/domain/notification-schedules/repository";
import { SUPPORTED_TIMEZONES } from "@/domain/notification-schedules/schema";
import { FormattingHelp } from "@/components/form-hints";
import { useTranslation } from "@/lib/i18n";

type Option = { id: string; name: string };
type UserOption = { id: string; name: string | null; email: string | null };
type TeamOption = { id: string; name: string; color: string };

interface CommonProps {
  categories: Option[];
  sessions: Option[];
  teams: TeamOption[];
  users: UserOption[];
}

type Props =
  | (CommonProps & { mode: "create" })
  | (CommonProps & {
      mode: "edit";
      schedule: Schedule;
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

export function ScheduleForm(props: Props) {
  const { t, locale } = useTranslation();
  const action =
    props.mode === "create"
      ? createScheduleAction
      : updateScheduleAction.bind(null, props.schedule.id);

  const [state, formAction] = useFormState<FormState<Schedule>, FormData>(
    action,
    idleFormState as FormState<Schedule>,
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const initial = props.mode === "edit" ? props.schedule : null;
  const initialTargets =
    props.mode === "edit" ? props.targets : { team_ids: [], user_ids: [] };

  const [times, setTimes] = useState<string[]>(initial?.times ?? ["09:00"]);
  const [days, setDays] = useState<number[]>(initial?.days_of_week ?? [1, 2, 3, 4, 5]);
  const [timezone, setTimezone] = useState<string>(initial?.timezone ?? "Europe/Paris");
  const [targetMode, setTargetMode] = useState<"all" | "teams" | "users">(
    initial?.target_mode ?? "all",
  );

  const [preview, setPreview] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const localeDates = locale === "en" ? "en-US" : "fr-FR";

  function refreshPreview(newTimes: string[], d: number[], tz: string) {
    startTransition(async () => {
      if (newTimes.length === 0 || d.length === 0) {
        setPreview(null);
        return;
      }
      try {
        const r = await previewScheduleAction({
          timezone: tz,
          times: newTimes,
          days_of_week: d,
        });
        setPreview(r);
      } catch {
        setPreview(null);
      }
    });
  }

  function addTime() {
    const n = [...times, "12:00"];
    setTimes(n);
    refreshPreview(n, days, timezone);
  }
  function removeTime(idx: number) {
    const n = times.filter((_, i) => i !== idx);
    setTimes(n);
    refreshPreview(n, days, timezone);
  }
  function setTimeAt(idx: number, value: string) {
    const n = times.map((v, i) => (i === idx ? value : v));
    setTimes(n);
    refreshPreview(n, days, timezone);
  }
  function toggleDay(day: number) {
    const n = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();
    setDays(n);
    refreshPreview(times, n, timezone);
  }
  function selectAllDays() {
    const n = [1, 2, 3, 4, 5, 6, 7];
    setDays(n);
    refreshPreview(times, n, timezone);
  }
  function selectWeekdays() {
    const n = [1, 2, 3, 4, 5];
    setDays(n);
    refreshPreview(times, n, timezone);
  }
  function onTimezoneChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setTimezone(next);
    refreshPreview(times, days, next);
  }

  const daysDef = t.adminSchedules.days;

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
          placeholder={t.adminSchedules.titlePlaceholder}
          error={errors?.title}
        />
        <TextAreaField
          label={t.feedForm.body}
          name="body"
          rows={4}
          defaultValue={initial?.body ?? ""}
          maxLength={5000}
          placeholder={t.feedForm.bodyPlaceholder}
        />
        <FormattingHelp />
      </section>

      {/* ---- 2. Quand ? ---- */}
      <section className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900">{t.adminSchedules.whenToSend}</h3>
          <p className="text-xs text-neutral-600">
            {t.adminSchedules.whenToSendDesc}
          </p>
        </header>

        {/* Heures */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">
            {t.adminSchedules.whatTimes}
          </label>
          <div className="space-y-2">
            {times.map((tv, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="time"
                  name="times"
                  value={tv}
                  onChange={(e) => setTimeAt(idx, e.target.value)}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  required
                />
                {times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTime(idx)}
                    className="text-xs text-neutral-500 hover:text-red-600"
                  >
                    {t.adminSchedules.remove}
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTime}
              className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
            >
              {t.adminSchedules.addTime}
            </button>
          </div>
          {errors?.times && <p className="mt-1 text-xs text-red-600">{errors.times}</p>}
        </div>

        {/* Jours */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-neutral-800">{t.adminSchedules.whatDays}</label>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={selectWeekdays}
                className="font-medium text-brand-700 hover:underline"
              >
                {t.adminSchedules.weekdays}
              </button>
              <span className="text-neutral-300">|</span>
              <button
                type="button"
                onClick={selectAllDays}
                className="font-medium text-brand-700 hover:underline"
              >
                {t.adminSchedules.allDays}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {daysDef.map((d, idx) => {
              const value = idx + 1;
              const active = days.includes(value);
              return (
                <label key={value} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="days_of_week"
                    value={value}
                    checked={active}
                    onChange={() => toggleDay(value)}
                    className="sr-only"
                  />
                  <span
                    title={d.label}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition ${
                      active
                        ? "btn-brand-gradient text-white shadow-sm"
                        : "border border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    {d.short}
                  </span>
                </label>
              );
            })}
          </div>
          {errors?.days_of_week && (
            <p className="mt-1 text-xs text-red-600">{errors.days_of_week}</p>
          )}
        </div>

        {/* Active */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.is_active ?? true}
            className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
          />
          {t.adminSchedules.enableSchedule}
        </label>

        {/* Preview */}
        {preview ? (
          <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">
            <span className="font-medium">{t.adminSchedules.nextSend}</span>{" "}
            {new Date(preview).toLocaleString(localeDates, {
              dateStyle: "full",
              timeStyle: "short",
              timeZone: timezone,
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            {t.adminSchedules.chooseTimeAndDay}
          </p>
        )}
      </section>

      {/* ---- 3. Destinataires ---- */}
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900">{t.feedForm.recipients}</h3>
          <p className="text-xs text-neutral-600">{t.feedForm.recipientsQuestionSchedule}</p>
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
          />
        )}
      </section>

      {/* ---- 4. Classement ---- */}
      <section className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900">{t.feedForm.classification}</h3>
          <p className="text-xs text-neutral-600">
            {t.feedForm.classificationDescSchedule}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label={t.feedForm.type} name="kind" defaultValue={initial?.kind ?? "notification"}>
            <option value="notification">{t.feedForm.notificationType}</option>
            <option value="reminder">{t.feedForm.reminderTypeShort}</option>
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
            hint={t.feedForm.periodHintSchedule}
          >
            <option value="">{t.feedForm.alwaysActive}</option>
            {props.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label={t.adminSchedules.timezone}
            name="timezone"
            value={timezone}
            onChange={onTimezoneChange}
            required
            hint={t.adminSchedules.timezoneHint}
          >
            {SUPPORTED_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </SelectField>
        </div>
      </section>

      {state.status === "error" && !errors && <FormError message={state.message} />}
      {state.status === "success" && state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <SubmitButton
          label={props.mode === "create" ? t.adminSchedules.createScheduleBtn : t.common.save}
          savingLabel={t.common.saving}
        />
      </div>
    </form>
  );
}

function TargetRadio({
  mode,
  value,
  onChange,
  title,
  description,
}: {
  mode: "all" | "teams" | "users";
  value: "all" | "teams" | "users";
  onChange: (m: "all" | "teams" | "users") => void;
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
}: {
  label: string;
  items: PickerItem[];
  name: string;
  initialSelected: string[];
  error?: string;
  emptyMessage: string;
  searchable?: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const initial = new Set(initialSelected);

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
                      defaultChecked={initial.has(i.id)}
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
