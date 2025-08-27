// src/pages/MyPosts.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listPosts, updatePost, deletePost, type Post, type PostCategory } from "../api/posts";
import API from "../api/axios";

const PAGE_SIZE = 10;
const MAX_LEN = 280;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export default function MyPosts() {
  const [meId, setMeId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Post | null>(null);
  const [confirming, setConfirming] = useState<Post | null>(null);

  // 1) Fetch /auth/me once to get numeric id
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get<{ id: number }>("/auth/me/");
        setMeId(res.data.id);
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? "Failed to load profile");
      }
    })();
  }, []);

  // 2) Fetch my posts using author=<id>
  useEffect(() => {
    if (!meId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listPosts({ author: meId, page, page_size: PAGE_SIZE });
        setPosts(Array.isArray(data.results) ? data.results : []);
        setCount(data.count ?? 0);
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? "Failed to load your posts");
      } finally {
        setLoading(false);
      }
    })();
  }, [meId, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);

  if (!meId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="text-sm text-gray-600">Loading your profile…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">My Posts</h1>

      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading && <div className="text-sm">Loading…</div>}
        {!loading && posts.length === 0 && <div className="text-sm text-gray-600">No posts yet.</div>}

        {posts.map((p) => (
          <article key={p.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <header className="mb-2 flex items-center gap-3">
              <img
                src={p.author_profile?.avatar_url || "/assets/avatar-default.png"}
                alt={`${p.author_username} avatar`}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-900">{p.author_username}</div>
                  <div className="text-xs text-slate-500">{new Date(p.created_at).toLocaleString()}</div>
                </div>
              </div>
            </header>

            <p className="whitespace-pre-wrap text-slate-800">{p.content}</p>

            {p.image_url && (
              <img src={p.image_url} alt="post" className="mt-3 w-full rounded-lg border" />
            )}

            <footer className="mt-3 flex items-center gap-3 text-sm text-slate-600">
              <span>❤ {p.like_count}</span>
              <span>💬 {p.comment_count}</span>
              {p.category && (
                <span className="ml-auto rounded bg-gray-100 px-2 py-1 text-xs">{p.category}</span>
              )}
            </footer>

            <div className="mt-3 flex gap-2">
              <button className="rounded border px-3 py-1 text-sm" onClick={() => setEditing(p)}>
                Edit
              </button>
              <button className="rounded border px-3 py-1 text-sm" onClick={() => setConfirming(p)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          className="rounded border px-3 py-1 disabled:opacity-50"
          onClick={() => setPage((prev) => (prev > 1 ? prev - 1 : 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <div className="text-sm">Page {page} / {totalPages}</div>
        <button
          type="button"
          className="rounded border px-3 py-1 disabled:opacity-50"
          onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : totalPages))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      {editing && (
        <EditModal
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            // refetch current page
            const data = await listPosts({ author: meId, page, page_size: PAGE_SIZE });
            setPosts(Array.isArray(data.results) ? data.results : []);
            setCount(data.count ?? 0);
          }}
        />
      )}

      {confirming && (
        <ConfirmDelete
          title="Delete post?"
          description="This cannot be undone."
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            try {
              await deletePost(confirming.id);
              setConfirming(null);
              const data = await listPosts({ author: meId, page, page_size: PAGE_SIZE });
              setPosts(Array.isArray(data.results) ? data.results : []);
              setCount(data.count ?? 0);
            } catch (e: any) {
              alert(e?.response?.data?.detail ?? "Failed to delete post");
            }
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  post,
  onClose,
  onSaved,
}: {
  post: Post;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState<PostCategory>(post.category ?? "general");
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return setFile(null);
    if (!ALLOWED_TYPES.has(f.type)) return alert("Only JPEG/PNG allowed.");
    if (f.size > MAX_IMAGE_BYTES) return alert("Image must be ≤ 2MB.");
    setFile(f);
  }

  function validate(): string | null {
    if (!content.trim()) return "Content is required";
    if (content.length > MAX_LEN) return `Content must be ≤ ${MAX_LEN} characters`;
    return null;
  }

  async function save() {
    const err = validate();
    if (err) return alert(err);

    try {
      setSaving(true);
      await updatePost(post.id, {
        content: content.trim(),
        category,
        image: file !== null ? file : undefined,
        remove_image: removeImage,
      });
      await onSaved();
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Failed to update post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <h2 className="text-lg font-semibold">Edit Post</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_LEN}
          className="mt-3 w-full resize-y rounded-xl border p-3"
          rows={4}
        />
        <div className="mt-3 flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PostCategory)}
            className="rounded-xl border px-3 py-2"
          >
            <option value="general">General</option>
            <option value="announcement">Announcement</option>
            <option value="question">Question</option>
          </select>
          <input type="file" accept="image/png,image/jpeg" onChange={pick} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={removeImage}
            onChange={(e) => setRemoveImage(e.target.checked)}
          />
          Remove existing image
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-1" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="rounded-lg border px-3 py-1" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({
  title,
  description,
  onCancel,
  onConfirm,
}: {
  title: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-1" onClick={onCancel}>Cancel</button>
          <button className="rounded-lg border px-3 py-1" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
