"use client";

import { useState } from "react";
import type { Template } from "@/domain/templates/repository";
import { useTranslation } from "@/lib/i18n";

interface Props {
  templates: Template[];
}

export function TemplateLoader({ templates }: Props) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState("");

  if (templates.length === 0) {
    return (
      <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
        {t.adminTemplates.noTemplatesHint}{" "}
        <a href="/admin/templates/new" className="font-medium text-brand-700 hover:underline">
          {t.adminTemplates.createOne}
        </a>
        .
      </div>
    );
  }

  function loadTemplate(id: string) {
    const tmpl = templates.find((x) => x.id === id);
    if (!tmpl) return;
    const form = document.querySelector<HTMLFormElement>("form");
    if (!form) return;

    const setInput = (name: string, value: string) => {
      const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[name="${name}"]`,
      );
      if (!el) return;
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };

    setInput("kind", tmpl.kind);
    setInput("title", tmpl.title);
    setInput("body", tmpl.body ?? "");
    setInput("priority", tmpl.priority);
    setInput("category_id", tmpl.category_id ?? "");
    setInput("action_label", tmpl.action_label ?? "");
    setInput("action_url", tmpl.action_url ?? "");

    const channelInputs = form.querySelectorAll<HTMLInputElement>('[name="send_channels"]');
    const wanted = new Set(tmpl.send_channels);
    channelInputs.forEach((input) => {
      input.checked = wanted.has(input.value);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-brand-200 bg-brand-50/50 p-3">
      <span className="text-sm font-medium text-brand-900">📋 {t.adminTemplates.fromTemplate}</span>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="flex-1 min-w-0 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      >
        <option value="">{t.adminTemplates.chooseTemplate}</option>
        {templates.map((tmpl) => (
          <option key={tmpl.id} value={tmpl.id}>
            {tmpl.name}
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
        {t.adminTemplates.loadBtn}
      </button>
    </div>
  );
}
