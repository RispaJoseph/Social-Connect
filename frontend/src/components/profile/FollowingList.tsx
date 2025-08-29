// src/components/profile/FollowingList.tsx
import { useEffect, useMemo, useState } from "react";
import { getFollowing, type UserLite } from "../../api/relations";
import { Link } from "react-router-dom";
import { Avatar } from "../Avatar";

export default function FollowingList({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [data, setData] = useState<{ results: UserLite[]; count: number }>({
    results: [],
    count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.count ?? 0) / pageSize)),
    [data.count]
  );

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await getFollowing(userId, page, pageSize);
      setData({ results: res.results ?? [], count: res.count ?? (res.results?.length ?? 0) });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load following");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, userId]);

  if (loading && data.results.length === 0) {
    return <div className="text-sm text-gray-600">Loading following…</div>;
  }
  if (err) {
    return <div className="text-sm text-red-600">{err}</div>;
  }
  if (data.results.length === 0) {
    return <div className="text-sm text-gray-600">Not following anyone yet.</div>;
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-md border bg-white">
        {data.results.map((u) => (
          <li key={u.id} className="flex items-center justify-between p-3">
            <Link to={`/profile/${u.id}`} className="flex items-center gap-3">
              <Avatar src={u.avatar_url} name={u.username} />
              <span className="font-medium">{u.username}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {page} of {totalPages} — {data.count} total
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
