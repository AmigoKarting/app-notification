"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteCommentAction,
  postCommentAction,
} from "@/domain/comments/actions";
import type { CommentWithAuthor } from "@/domain/comments/repository";

interface Props {
  feedItemId: string;
  comments: CommentWithAuthor[];
  currentUserId: string;
}

function PostButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-brand-gradient inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-50"
    >
      {pending ? "Envoi…" : "Publier"}
    </button>
  );
}

export function FeedComments({ feedItemId, comments, currentUserId }: Props) {
  const [open, setOpen] = useState(comments.length > 0);

  return (
    <div className="border-t border-neutral-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <span>💬</span>
        <span>
          {comments.length === 0
            ? "Ajouter un commentaire"
            : `${comments.length} commentaire${comments.length > 1 ? "s" : ""}`}
        </span>
        <span className="text-xs text-neutral-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {comments.length > 0 && (
            <ul className="space-y-2.5">
              {comments.map((c) => {
                const author =
                  c.author?.display_name?.trim() || c.author?.email || "Sans nom";
                const mine = c.user_id === currentUserId;
                return (
                  <li
                    key={c.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                      <span className="font-medium text-neutral-700">{author}</span>
                      <div className="flex items-center gap-2">
                        <time dateTime={c.created_at}>
                          {new Date(c.created_at).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </time>
                        {mine && (
                          <form
                            action={deleteCommentAction}
                            onSubmit={(e) => {
                              if (!window.confirm("Supprimer ce commentaire ?")) e.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="feed_item_id" value={feedItemId} />
                            <button
                              type="submit"
                              className="text-xs text-neutral-400 hover:text-red-600"
                              title="Supprimer"
                            >
                              ✕
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
                      {c.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <CommentForm feedItemId={feedItemId} />
        </div>
      )}
    </div>
  );
}

function CommentForm({ feedItemId }: { feedItemId: string }) {
  const [value, setValue] = useState("");
  return (
    <form
      action={async (formData) => {
        await postCommentAction(formData);
        setValue("");
      }}
      className="flex items-end gap-2"
    >
      <input type="hidden" name="feed_item_id" value={feedItemId} />
      <textarea
        name="body"
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 2000))}
        placeholder="Écris ton commentaire…"
        className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        required
      />
      <PostButton />
    </form>
  );
}
