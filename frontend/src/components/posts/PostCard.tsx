// src/components/posts/PostCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import type { Post } from "../../api/posts";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=U&background=E2E8F0&color=334155";

type Props = {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
};

export default function PostCard({ post, onEdit, onDelete }: Props) {
  const avatar = post.author_profile?.avatar_url || DEFAULT_AVATAR;
  const created = new Date(post.created_at);
  const when = isNaN(created.getTime())
    ? post.created_at
    : created.toLocaleString();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={`${post.author_username} avatar`}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-medium text-slate-800">
              {post.author_username}
            </div>
            <div className="text-xs text-slate-500">{when}</div>
          </div>
          <div className="mt-1 inline-flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-600">
              {post.category}
            </span>
            {!post.is_active && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-rose-700">
                inactive
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-slate-800">
        {post.content}
      </div>

      {post.image_url && (
        <div className="mt-3 overflow-hidden rounded-xl border">
          <img
            src={post.image_url}
            alt="post"
            className="max-h-[480px] w-full object-cover"
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center gap-4">
          <span>👍 {post.like_count}</span>
          <span>💬 {post.comment_count}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/posts/${post.id}`}
            className="rounded-lg border px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            View
          </Link>
          {onEdit && (
            <button
              onClick={() => onEdit(post)}
              className="rounded-lg border px-3 py-1.5 hover:bg-slate-50"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(post)}
              className="rounded-lg border px-3 py-1.5 text-rose-600 hover:bg-rose-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
