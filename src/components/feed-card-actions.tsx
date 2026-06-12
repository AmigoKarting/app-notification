"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { useTranslation } from "@/lib/i18n";

export function FeedCardActions({
  title,
  body,
}: {
  title: string;
  body?: string | null;
}) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const stripMarkdown = (text: string) =>
    text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s/gm, "");

  const handleCopy = async () => {
    const clean = body ? `${title}\n\n${stripMarkdown(body)}` : title;
    try {
      await navigator.clipboard.writeText(clean);
      if (navigator.vibrate) navigator.vibrate(15);
      toast(t.feed.copied, "success");
    } catch {
      /* clipboard blocked */
    }
  };

  const handleShare = async () => {
    const clean = body ? stripMarkdown(body) : undefined;
    try {
      await navigator.share({ title, text: clean });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="ml-auto flex items-center gap-0.5">
      <button
        type="button"
        onClick={handleCopy}
        title={t.feed.copy}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
      {canShare && (
        <button
          type="button"
          onClick={handleShare}
          title={t.feed.share}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      )}
    </div>
  );
}
