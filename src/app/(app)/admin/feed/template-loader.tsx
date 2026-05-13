"use client";

import { useState } from "react";
import type { Template } from "@/domain/templates/repository";

interface Props {
  templates: Template[];
}

/**
 * Petit composant qui charge un template dans le formulaire actif.
 * Met les valeurs dans les champs (inputs / textarea / select / checkbox)
 * en cherchant par leur `name`. Compatible avec le form parent sans
 * coupler les composants (DOM-based, no React context).
 */
export function TemplateLoader({ templates }: Props) {
  const [selectedId, setSelectedId] = useState("");

  if (templates.length === 0) {
    return (
      <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
        Aucun modèle pour l'instant.{" "}
        <a href="/admin/templates/new" className="font-medium text-brand-700 hover:underline">
          En créer un
        </a>
        .
      </div>
    );
  }

  function loadTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    const form = document.querySelector<HTMLFormElement>("form");
    if (!form) return;

    const setInput = (name: string, value: string) => {
      const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[name="${name}"]`,
      );
      if (!el) return;
      el.value = value;
      // déclenche un event change pour les composants contrôlés (notre form ne l'est pas mais ça ne nuit pas)
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };

    setInput("kind", t.kind);
    setInput("title", t.title);
    setInput("body", t.body ?? "");
    setInput("priority", t.priority);
    setInput("category_id", t.category_id ?? "");
    setInput("action_label", t.action_label ?? "");
    setInput("action_url", t.action_url ?? "");

    // Coche les channels du template
    const channelInputs = form.querySelectorAll<HTMLInputElement>('[name="send_channels"]');
    const wanted = new Set(t.send_channels);
    channelInputs.forEach((input) => {
      input.checked = wanted.has(input.value);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-brand-200 bg-brand-50/50 p-3">
      <span className="text-sm font-medium text-brand-900">📋 Partir d'un modèle :</span>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="flex-1 min-w-0 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      >
        <option value="">— Choisir un modèle —</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!selectedId}
        onClick={() => {
          loadTemplate(selectedId);
          setSelectedId("");
        }}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
      >
        Charger
      </button>
    </div>
  );
}
