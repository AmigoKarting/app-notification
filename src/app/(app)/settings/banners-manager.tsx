"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { Button, Field, FormError, SelectField } from "@/components/ui";
import {
  createBannerAction,
  deleteBannerAction,
  updateBannerAction,
} from "@/domain/role-banners/actions";
import { idleFormState, type FormState } from "@/domain/form-state";
import { useTranslation } from "@/lib/i18n";

type Banner = {
  role_slug: string;
  enabled: boolean;
  message: string;
  cta_label: string | null;
  cta_url: string;
  icon: string;
  color: string;
  dismiss_condition: string | null;
};

type RoleOption = { slug: string; name: string; icon: string | null };

interface Props {
  banners: Banner[];
  /** Tous les rôles disponibles pour la dropdown du formulaire de création. */
  allRoles: RoleOption[];
}

const DISMISS_OPTIONS = [
  { value: "none", labelFr: "Toujours visible", labelEn: "Always visible" },
  {
    value: "cashier_checklist_done",
    labelFr: "Disparaît si la checklist du jour est faite",
    labelEn: "Hides when today's checklist is submitted",
  },
];

function SaveBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const { t } = useTranslation();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.common.saving : label}
    </Button>
  );
}

function DangerBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function BannersManager({ banners, allRoles }: Props) {
  const { t, locale } = useTranslation();
  const [showCreate, setShowCreate] = useState(false);

  const usedSlugs = new Set(banners.map((b) => b.role_slug));
  const availableRoles = allRoles.filter((r) => !usedSlugs.has(r.slug));

  return (
    <div className="space-y-4">
      {/* Liste existante */}
      {banners.length === 0 && !showCreate && (
        <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm italic text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {t.bannersAdmin.empty}
        </p>
      )}

      {banners.map((banner) => (
        <BannerRow
          key={banner.role_slug}
          banner={banner}
          roleName={
            allRoles.find((r) => r.slug === banner.role_slug)?.name ?? banner.role_slug
          }
          locale={locale}
        />
      ))}

      {/* Bouton/formulaire pour ajouter */}
      {showCreate ? (
        <CreateForm
          availableRoles={availableRoles}
          onCancel={() => setShowCreate(false)}
        />
      ) : (
        availableRoles.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowCreate(true)}
          >
            {t.bannersAdmin.addBanner}
          </Button>
        )
      )}

      {availableRoles.length === 0 && !showCreate && banners.length > 0 && (
        <p className="text-xs italic text-neutral-500 dark:text-neutral-400">
          {t.bannersAdmin.allRolesCovered}
        </p>
      )}
    </div>
  );
}

function BannerRow({
  banner,
  roleName,
  locale,
}: {
  banner: Banner;
  roleName: string;
  locale: string;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useFormState<FormState<unknown>, FormData>(
    updateBannerAction as unknown as (
      prev: FormState<unknown>,
      formData: FormData,
    ) => Promise<FormState<unknown>>,
    idleFormState as FormState<unknown>,
  );
  // État local pour preview live en mode édition
  const [message, setMessage] = useState(banner.message);
  const [ctaLabel, setCtaLabel] = useState(banner.cta_label ?? "");
  const [icon, setIcon] = useState(banner.icon);
  const [color, setColor] = useState(banner.color);
  const [enabled, setEnabled] = useState(banner.enabled);

  if (!editing) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {roleName}
            </p>
            <p className="font-mono text-[10px] text-neutral-400">{banner.role_slug}</p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              banner.enabled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {banner.enabled ? t.bannersAdmin.enabled : t.bannersAdmin.disabled}
          </span>
        </div>

        {/* Preview */}
        <div
          className="mb-3 rounded-md border"
          style={{
            backgroundColor: `${banner.color}1f`,
            borderColor: `${banner.color}55`,
          }}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <p className="flex items-center gap-2 text-sm font-medium" style={{ color: banner.color }}>
              <span>{banner.icon}</span>
              <span>{banner.message}</span>
            </p>
            {banner.cta_label && (
              <span
                className="shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: banner.color }}
              >
                {banner.cta_label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {t.common.edit}
          </button>
          <form
            action={deleteBannerAction}
            onSubmit={(e) => {
              if (!confirm(t.bannersAdmin.confirmDelete)) e.preventDefault();
            }}
          >
            <input type="hidden" name="role_slug" value={banner.role_slug} />
            <DangerBtn label={t.common.delete} />
          </form>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-lg border border-brand-300 bg-brand-50/30 p-4 dark:border-brand-700 dark:bg-brand-900/10"
    >
      <input type="hidden" name="role_slug" value={banner.role_slug} />

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {roleName}
        <span className="ml-2 font-mono text-[10px] normal-case text-neutral-400">
          {banner.role_slug}
        </span>
      </p>

      <SharedFields
        defaultMessage={message}
        defaultCtaLabel={ctaLabel}
        defaultCtaUrl={banner.cta_url}
        defaultIcon={icon}
        defaultColor={color}
        defaultEnabled={enabled}
        defaultDismiss={banner.dismiss_condition ?? "none"}
        onMessageChange={setMessage}
        onCtaLabelChange={setCtaLabel}
        onIconChange={setIcon}
        onColorChange={setColor}
        onEnabledChange={setEnabled}
        fieldErrors={state.status === "error" ? state.fieldErrors : undefined}
        locale={t}
      />

      {/* Aperçu live */}
      <LivePreview
        enabled={enabled}
        message={message}
        ctaLabel={ctaLabel}
        icon={icon}
        color={color}
        previewLabel={t.bannersAdmin.preview}
        disabledLabel={t.bannersAdmin.disabledPreview}
      />

      {state.status === "error" && <FormError message={state.message} />}
      {state.status === "success" && (
        <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
        >
          {t.common.cancel}
        </button>
        <SaveBtn label={t.common.save} />
      </div>
    </form>
  );
}

function CreateForm({
  availableRoles,
  onCancel,
}: {
  availableRoles: RoleOption[];
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [state, formAction] = useFormState<FormState<unknown>, FormData>(
    createBannerAction as unknown as (
      prev: FormState<unknown>,
      formData: FormData,
    ) => Promise<FormState<unknown>>,
    idleFormState as FormState<unknown>,
  );

  const [message, setMessage] = useState("Mon message");
  const [ctaLabel, setCtaLabel] = useState("Ouvrir");
  const [icon, setIcon] = useState("📋");
  const [color, setColor] = useState("#f59e0b");
  const [enabled, setEnabled] = useState(true);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-brand-300 bg-brand-50/30 p-4 dark:border-brand-700 dark:bg-brand-900/10"
    >
      <SelectField
        label={t.bannersAdmin.targetRole}
        name="role_slug"
        defaultValue={availableRoles[0]?.slug ?? ""}
        hint={t.bannersAdmin.targetRoleHint}
      >
        {availableRoles.map((r) => (
          <option key={r.slug} value={r.slug}>
            {r.icon ? `${r.icon} ` : ""}
            {r.name}
          </option>
        ))}
      </SelectField>

      <div className="mt-4">
        <SharedFields
          defaultMessage={message}
          defaultCtaLabel={ctaLabel}
          defaultCtaUrl="/"
          defaultIcon={icon}
          defaultColor={color}
          defaultEnabled={enabled}
          defaultDismiss="none"
          onMessageChange={setMessage}
          onCtaLabelChange={setCtaLabel}
          onIconChange={setIcon}
          onColorChange={setColor}
          onEnabledChange={setEnabled}
          fieldErrors={state.status === "error" ? state.fieldErrors : undefined}
          locale={t}
        />
      </div>

      <LivePreview
        enabled={enabled}
        message={message}
        ctaLabel={ctaLabel}
        icon={icon}
        color={color}
        previewLabel={t.bannersAdmin.preview}
        disabledLabel={t.bannersAdmin.disabledPreview}
      />

      {state.status === "error" && <FormError message={state.message} />}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
        >
          {t.common.cancel}
        </button>
        <SaveBtn label={t.bannersAdmin.create} />
      </div>
    </form>
  );
}

function SharedFields(props: {
  defaultMessage: string;
  defaultCtaLabel: string;
  defaultCtaUrl: string;
  defaultIcon: string;
  defaultColor: string;
  defaultEnabled: boolean;
  defaultDismiss: string;
  onMessageChange: (v: string) => void;
  onCtaLabelChange: (v: string) => void;
  onIconChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onEnabledChange: (v: boolean) => void;
  fieldErrors?: Record<string, string>;
  locale: ReturnType<typeof useTranslation>["t"];
}) {
  const t = props.locale;
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={props.defaultEnabled}
          onChange={(e) => props.onEnabledChange(e.target.checked)}
          className="h-4 w-4"
        />
        <span>{t.bannersAdmin.enabled}</span>
      </label>

      <Field
        label={t.bannersAdmin.message}
        name="message"
        type="text"
        defaultValue={props.defaultMessage}
        maxLength={160}
        required
        error={props.fieldErrors?.message}
        onChange={(e) => props.onMessageChange(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label={t.bannersAdmin.ctaLabel}
          name="cta_label"
          type="text"
          defaultValue={props.defaultCtaLabel}
          maxLength={40}
          hint={t.bannersAdmin.ctaLabelHint}
          onChange={(e) => props.onCtaLabelChange(e.target.value)}
        />
        <Field
          label={t.bannersAdmin.ctaUrl}
          name="cta_url"
          type="text"
          defaultValue={props.defaultCtaUrl}
          maxLength={500}
          hint={t.bannersAdmin.ctaUrlHint}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label={t.bannersAdmin.icon}
          name="icon"
          type="text"
          defaultValue={props.defaultIcon}
          maxLength={4}
          hint={t.bannersAdmin.iconHint}
          onChange={(e) => props.onIconChange(e.target.value)}
        />
        <Field
          label={t.bannersAdmin.color}
          name="color"
          type="color"
          defaultValue={props.defaultColor}
          className="h-10 w-20 cursor-pointer"
          onChange={(e) => props.onColorChange(e.target.value)}
        />
      </div>

      <SelectField
        label={t.bannersAdmin.dismissCondition}
        name="dismiss_condition"
        defaultValue={props.defaultDismiss}
        hint={t.bannersAdmin.dismissConditionHint}
      >
        {DISMISS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.labelFr}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

function LivePreview({
  enabled,
  message,
  ctaLabel,
  icon,
  color,
  previewLabel,
  disabledLabel,
}: {
  enabled: boolean;
  message: string;
  ctaLabel: string;
  icon: string;
  color: string;
  previewLabel: string;
  disabledLabel: string;
}) {
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {previewLabel}
      </p>
      {enabled ? (
        <div
          className="rounded-md border"
          style={{
            backgroundColor: `${color}1f`,
            borderColor: `${color}55`,
          }}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <p className="flex items-center gap-2 text-sm font-medium" style={{ color }}>
              <span>{icon}</span>
              <span>{message || "—"}</span>
            </p>
            {ctaLabel && (
              <span
                className="shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {ctaLabel}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-xs italic text-neutral-500 dark:border-neutral-700">
          {disabledLabel}
        </p>
      )}
    </div>
  );
}
