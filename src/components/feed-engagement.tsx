"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  markAsReadAction,
  markAsUnreadAction,
  toggleReactionAction,
} from "@/domain/feed/actions";

const DEFAULT_EMOJIS = ["👍", "❤️", "😄", "🎉", "🚀"] as const;

function PendingButton({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className: string;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className={`${className} disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export function ReactionBar({
  feedItemId,
  counts,
  myReactions,
}: {
  feedItemId: string;
  counts: Record<string, number>;
  myReactions: string[];
}) {
  const mine = new Set(myReactions);
  // Tous les emojis existants (par défaut + ceux déjà utilisés)
  const allEmojis = Array.from(
    new Set<string>([...DEFAULT_EMOJIS, ...Object.keys(counts)]),
  );

  const [adding, setAdding] = useState(false);
  const [customValue, setCustomValue] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allEmojis.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const reacted = mine.has(emoji);
        return (
          <form key={emoji} action={toggleReactionAction}>
            <input type="hidden" name="feed_item_id" value={feedItemId} />
            <input type="hidden" name="emoji" value={emoji} />
            <PendingButton
              title={reacted ? "Retirer ma réaction" : "Réagir"}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition ${
                reacted
                  ? "border-brand-500 bg-brand-50 text-brand-800"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <span>{emoji}</span>
              {count > 0 && (
                <span className={`text-xs ${reacted ? "font-semibold" : ""}`}>{count}</span>
              )}
            </PendingButton>
          </form>
        );
      })}

      {/* Bouton + pour ajouter un emoji custom */}
      {adding ? (
        <form
          action={toggleReactionAction}
          onSubmit={() => {
            setAdding(false);
            setCustomValue("");
          }}
          className="flex items-center gap-1"
        >
          <input type="hidden" name="feed_item_id" value={feedItemId} />
          <input
            type="text"
            name="emoji"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value.slice(0, 4))}
            placeholder="🤔"
            maxLength={4}
            autoFocus
            className="w-14 rounded-full border border-brand-300 bg-white px-2 py-0.5 text-center text-sm outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!customValue}
            className="text-xs font-medium text-brand-700 disabled:opacity-50"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setCustomValue("");
            }}
            className="text-xs text-neutral-500"
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          title="Ajouter une autre réaction"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-500 transition hover:border-neutral-400 hover:bg-neutral-50"
        >
          +
        </button>
      )}
    </div>
  );
}

export function ReadToggle({
  feedItemId,
  isRead,
}: {
  feedItemId: string;
  isRead: boolean;
}) {
  return (
    <form action={isRead ? markAsUnreadAction : markAsReadAction}>
      <input type="hidden" name="feed_item_id" value={feedItemId} />
      <PendingButton
        title={isRead ? "Marquer comme non lu" : "Marquer comme lu"}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition ${
          isRead
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
            : "bg-neutral-100 text-neutral-700 ring-neutral-200 hover:bg-neutral-200"
        }`}
      >
        {isRead ? "✓ Lu" : "Marquer comme lu"}
      </PendingButton>
    </form>
  );
}
