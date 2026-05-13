"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ImageUpload({
  initialUrl,
  name = "image_url",
}: {
  initialUrl?: string | null;
  name?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde (max 5 Mo).");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error: uploadError } = await supabase.storage
        .from("notifications")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        setError(`Échec de l'upload : ${uploadError.message}`);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("notifications").getPublicUrl(data.path);
      setImageUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-neutral-800">Image (optionnel)</p>
      {/* Hidden field that the form submission picks up */}
      <input type="hidden" name={name} value={imageUrl ?? ""} />

      <div className="flex items-start gap-4">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Aperçu"
            className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white text-xs text-neutral-400">
            Aucune
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs text-neutral-500">
            PNG, JPG ou WebP. 5 Mo max. Affichée en tête de la notification.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <span className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50">
                {uploading ? "Upload..." : imageUrl ? "Changer" : "Choisir une image"}
              </span>
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={clearImage}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Retirer
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
