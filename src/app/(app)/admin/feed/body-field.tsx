"use client";

import { useState, useRef } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { useTranslation } from "@/lib/i18n";

interface BodyFieldProps {
  defaultValue?: string;
  maxLength?: number;
  placeholder?: string;
}

export function BodyField({ defaultValue = "", maxLength, placeholder }: BodyFieldProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [value, setValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {t.feedForm.body}
        </span>
        <div className="flex rounded-md border border-neutral-200 text-xs dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`px-3 py-1 transition ${tab === "write" ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100" : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"}`}
          >
            {t.feedForm.write}
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`px-3 py-1 transition ${tab === "preview" ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100" : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"}`}
          >
            {t.feedForm.preview}
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          name="body"
          rows={4}
          maxLength={maxLength}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-brand-500 dark:focus:ring-brand-800"
        />
      ) : (
        <div className="min-h-[6rem] rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300">
          {value ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
          ) : (
            <p className="italic text-neutral-400">{t.feedForm.previewEmpty}</p>
          )}
        </div>
      )}
      {/* Hidden input ensures form data is always sent even when on preview tab */}
      {tab === "preview" && <input type="hidden" name="body" value={value} />}
    </div>
  );
}
