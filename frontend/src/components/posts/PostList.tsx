// src/components/posts/PostList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listPosts, type ListPostsParams } from "../../api/posts";
import type { Post } from "../../api/posts";
import PostCard from "./PostCard";
import PostEditor from "./PostEditor";
import { updatePost, deletePost } from "../../api/posts";

type Props = {
  initialParams?: ListPostsParams;
  // Hide category filter if you're already scoping to a user
  showFilters?: boolean;
};

export default function PostList({ initialParams, showFilters = true }: Props) {
  const [params, setParams] = useState<ListPostsParams>(initialParams || {});
  const [data, setData] = useState<Post[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const res = await listPosts({ ...params, page: p });
      setData(res.results);
      setCount(res.count);
    } catch (err: any) {
      setError(err?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / (params.page_size || 10))),
    [count, params.page_size]
  );

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={params.category || ""}
            onChange={(e) =>
              setParams((prev) => ({
                ...prev,
                category: (e.target.value || undefined) as any,
              }))
            }
            className="rounded-lg border px-3 py-2"
          >
            <option value="">All categories</option>
            <option value="general">General</option>
            <option value="announcement">Announcement</option>
            <option value="question">Question</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border p-6 text-slate-500">Loading...</div>
      ) : error ? (
        <div className="rounded-2xl border p-4 text-rose-600">{error}</div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border p-6 text-slate-500">No posts yet.</div>
      ) : (
        <div className="space-y-4">
          {data.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={(p) => setEditing(p)}
              onDelete={async (p) => {
                if (!window.confirm("Delete this post?")) return;
                await deletePost(p.id);
                await load(page);
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            onClick={async () => {
              const next = Math.max(1, page - 1);
              setPage(next);
              await load(next);
            }}
            disabled={page <= 1}
          >
            Prev
          </button>
          <span className="text-sm text-slate-600">
            Page {page} / {totalPages}
          </span>
          <button
            className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            onClick={async () => {
              const next = Math.min(totalPages, page + 1);
              setPage(next);
              await load(next);
            }}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}

      {editing && (
        <PostEditor
          post={editing}
          onClose={() => setEditing(null)}
          onSave={async (vals) => {
            const updated = await updatePost(editing.id, vals);
            // update list in place
            setData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          }}
        />
      )}
    </div>
  );
}
