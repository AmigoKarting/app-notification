"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Field, FormError } from "@/components/ui";
import { updateBrandingAction } from "@/domain/branding/actions";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";

interface Props {
  initial: {
    app_name: string;
    app_tagline: string | null;
    logo_url: string | null;
  };
}

export function BrandingForm({ initial }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [appName, setAppName] = useState(initial.app_name);
  const [tagline, setTagline] = useState(initial.app_tagline ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logo_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    if (!file.type.startsWith("image/")) {
      setError(t.adminBranding.fileNotImage);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t.adminBranding.fileTooLarge);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("branding")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        setError(`${t.adminBranding.uploadFailed}: ${uploadError.message}`);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("branding").getPublicUrl(uploadData.path);
      setLogoUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.profileForm.unexpectedError);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("app_name", appName);
      fd.set("app_tagline", tagline);
      fd.set("logo_url", logoUrl ?? "");
      const result = await updateBrandingAction({ status: "idle" }, fd);
      if (result.status === "error") {
        setError(result.message);
      } else if (result.status === "success") {
        setSuccess(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function clearLogo() {
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Logo preview */}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-soft">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={t.adminBranding.logoLabel}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-neutral-400">{t.adminBranding.noLogo}</span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-800">{t.adminBranding.logoLabel}</p>
          <p className="text-xs text-neutral-500">
            {t.adminBranding.logoHint}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="sr-only"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <span className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50">
                {uploading ? t.adminBranding.uploading : logoUrl ? t.adminBranding.changeBtn : t.adminBranding.uploadBtn}
              </span>
            </label>
            {logoUrl && (
              <button
                type="button"
                onClick={clearLogo}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                {t.adminBranding.removeBtn}
              </button>
            )}
          </div>
        </div>
      </div>

      <Field
        label={t.adminBranding.appName}
        name="app_name"
        value={appName}
        onChange={(e) => setAppName(e.target.value)}
        required
        maxLength={80}
        hint={t.adminBranding.appNameHint}
      />

      <Field
        label={t.adminBranding.tagline}
        name="app_tagline"
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        maxLength={200}
        hint={t.adminBranding.taglineHint}
      />

      {error && <FormError message={error} />}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t.adminBranding.successMessage}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? t.common.saving : t.common.save}
        </Button>
      </div>
    </form>
  );
}
