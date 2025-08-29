// src/pages/admin/Posts.tsx
import { useEffect, useMemo, useState } from "react";
import { listPosts, deletePost, type AdminPost } from "../../api/admin";

export default function AdminPostsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [data, setData] = useState<{ results: AdminPost[]; count: number }>({
    results: [],
    count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.count ?? 0) / pageSize)),
    [data?.count]
  );

  async function fetchPosts() {
    setLoading(true);
    setError(null);
    try {
      const res = await listPosts({ page, page_size: pageSize });
      setData({ results: res.results, count: res.count });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function onDelete(p: AdminPost) {
    const ok = window.confirm(`Delete post ${p.id}?`);
    if (!ok) return;
    try {
      await deletePost(p.id);
      await fetchPosts();
      alert(`Deleted post ${p.id}`);
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete post");
    }
  }

  return (
    <section>
      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Author</th>
              <th className="text-left p-3">Content</th>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && data.results.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No posts.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              data.results.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.id}</td>
                  <td className="p-3">{p.author}</td>
                  <td className="p-3">
                    {p.content.length > 80 ? p.content.slice(0, 80) + "…" : p.content}
                  </td>
                  <td className="p-3">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50"
                      onClick={() => onDelete(p)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {page} of {totalPages} — {data.count} total
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
