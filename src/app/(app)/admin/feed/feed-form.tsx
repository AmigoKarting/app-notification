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
      item: FeedItem;
      targets: { team_ids: string[]; user_ids: string[] };
    });

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement..." : label}
    </Button>
  );
}

export function FeedItemForm(props: Props) {
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

  const initialChannels = new Set(initial?.send_channels ?? []);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {/* ---- 1. Contenu ---- */}
      <section className="space-y-4">
        <Field
          label="Titre"
          name="title"
          defaultValue={initial?.title ?? ""}
          required
          maxLength={160}
          placeholder="Ex: Réunion équipe — vendredi 14h"
          error={errors?.title}
        />

        <TextAreaField
          label="Message"
          name="body"
          rows={4}
          defaultValue={initial?.body ?? ""}
          maxLength={5000}
          placeholder="Détails du message…"
        />
        <FormattingHelp />

        <ImageUpload initialUrl={initial?.image_url} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Libellé du bouton (optionnel)"
            name="action_label"
            defaultValue={initial?.action_label ?? ""}
            maxLength={60}
            placeholder="Ex: S'inscrire, En savoir plus"
            hint="Affiché en bas de la notification"
            error={errors?.action_label}
          />
          <Field
            label="URL du bouton"
            name="action_url"
            type="url"
            defaultValue={initial?.action_url ?? ""}
            placeholder="https://…"
            hint="Renseigner les deux ou aucun"
            error={errors?.action_url}
          />
        </div>
      </section>

      {/* ---- 1.5. Diffusion (épinglé / brouillon / canaux externes) ---- */}
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900">Diffusion</h3>
          <p className="text-xs text-neutral-600">
            État de la publication et envois externes.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleOption
            name="is_draft"
            defaultChecked={initial?.is_draft ?? false}
            label="Brouillon"
            description="Pas publié — visible uniquement par toi."
          />
          <ToggleOption
            name="is_pinned"
            defaultChecked={initial?.is_pinned ?? false}
            label="Épingler en haut"
            description="Toujours en tête du fil pour les destinataires."
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-800">
            Envoyer aussi par
          </p>
          <p className="mb-2 text-xs text-neutral-500">
            En plus de l'affichage dans le fil. Nécessite un provider configuré (Resend pour email, Twilio pour SMS).
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
          </div>
        </div>
      </section>

      {/* ---- 2. Destinataires ---- */}
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900">Destinataires</h3>
          <p className="text-xs text-neutral-600">Qui verra cette notification ?</p>
        </header>

        <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <TargetRadio
            mode={targetMode}
            value="all"
            onChange={setTargetMode}
            title="Tout le monde"
            description="Tous les utilisateurs."
          />
          <TargetRadio
            mode={targetMode}
            value="teams"
            onChange={setTargetMode}
            title="Des équipes"
            description="Membres des équipes choisies."
          />
          <TargetRadio
            mode={targetMode}
            value="users"
            onChange={setTargetMode}
            title="Des personnes"
            description="Personnes précises."
          />
        </fieldset>

        {targetMode === "teams" && (
          <PickerList
            label="Équipes"
            error={errors?.target_team_ids}
            emptyMessage="Aucune équipe. Crée-en une dans Admin → Équipes."
            items={props.teams.map((t) => ({
              id: t.id,
              primary: t.name,
              accentColor: t.color,
            }))}
            name="target_team_ids"
            initialSelected={initialTargets.team_ids}
          />
        )}

        {targetMode === "users" && (
          <PickerList
            label="Personnes"
            error={errors?.target_user_ids}
            emptyMessage="Aucun utilisateur inscrit."
            items={props.users.map((u) => ({
              id: u.id,
              primary: u.name?.trim() || u.email || "Sans nom",
              secondary: u.name ? u.email ?? undefined : undefined,
            }))}
            name="target_user_ids"
            initialSelected={initialTargets.user_ids}
            searchable
          />
        )}
      </section>

      {/* ---- 3. Classement (catégorie, période, priorité, type) ---- */}
      <section className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900">Classement</h3>
          <p className="text-xs text-neutral-600">
            Comment ranger et présenter cette notification.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Type"
            name="kind"
            defaultValue={initial?.kind ?? "notification"}
            required
            hint="Info pure, ou rappel avec date limite"
          >
            <option value="notification">Notification (info)</option>
            <option value="reminder">Rappel (avec date limite)</option>
          </SelectField>

          <SelectField
            label="Priorité"
            name="priority"
            defaultValue={initial?.priority ?? "normal"}
          >
            <option value="low">Basse</option>
            <option value="normal">Normale</option>
            <option value="high">Haute</option>
          </SelectField>

          <SelectField
            label="Catégorie"
            name="category_id"
            defaultValue={initial?.category_id ?? ""}
            hint="Pour filtrer dans le fil"
          >
            <option value="">Aucune</option>
            {props.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Période"
            name="session_id"
            defaultValue={initial?.session_id ?? ""}
            hint="Visible seulement pendant la période"
          >
            <option value="">Toujours visible</option>
            {props.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        </div>
      </section>

      {/* ---- 4. Dates ---- */}
      <section className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-5">
        <header>
          <h3 className="text-sm font-semibold text-neutral-900">Dates</h3>
          <p className="text-xs text-neutral-600">
            Quand publier, quand cacher (laisser vide = maintenant / jamais).
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="Publier le…"
            name="published_at"
            type="datetime-local"
            defaultValue={initial?.published_at ? toDatetimeLocal(initial.published_at) : ""}
            hint="Vide = maintenant"
          />
          <Field
            label="Cacher après le…"
            name="expires_at"
            type="datetime-local"
            defaultValue={initial?.expires_at ? toDatetimeLocal(initial.expires_at) : ""}
            hint="Vide = jamais"
          />
          <Field
            label="Date limite (si rappel)"
            name="due_date"
            type="datetime-local"
            defaultValue={initial?.due_date ? toDatetimeLocal(initial.due_date) : ""}
            hint="Pour les rappels"
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
        <SubmitButton label={props.mode === "create" ? "Publier" : "Enregistrer"} />
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
}: {
  label: string;
  items: PickerItem[];
  name: string;
  initialSelected: string[];
  error?: string;
  emptyMessage: string;
  searchable?: boolean;
}) {
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
          placeholder="Rechercher…"
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
            <p className="px-4 py-6 text-center text-sm text-neutral-500">Aucun résultat.</p>
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
