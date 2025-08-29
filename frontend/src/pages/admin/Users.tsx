// src/pages/admin/Users.tsx
import { useEffect, useMemo, useState } from "react";
import {
  listUsers,
  deactivateUser,
  type AdminUser,
} from "../../api/admin";
import { api } from "../../lib/api"; // for activate endpoint
import { Link } from "react-router-dom";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [data, setData] = useState<{ results: AdminUser[]; count: number }>({
    results: [],
    count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.count ?? 0) / pageSize)),
    [data?.count]
  );

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({ page, page_size: pageSize });
      setData({ results: res.results, count: res.count });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function onToggleActive(u: AdminUser) {
    if (u.is_staff && u.id === 1) {
      // Optionally: prevent superuser (id=1) from being touched
      alert("Superuser cannot be modified");
      return;
    }

    const action = u.is_active ? "Deactivate" : "Activate";
    const ok = window.confirm(`${action} user "${u.username}"?`);
    if (!ok) return;

    try {
      if (u.is_active) {
        await deactivateUser(u.id);
      } else {
        // activate endpoint (assumes POST /api/admin/users/{id}/activate/)
        await api.post(`/admin/users/${u.id}/activate/`, {});
      }
      await fetchUsers();
      alert(`${action}d ${u.username}`);
    } catch (e: any) {
      alert(e?.message ?? `Failed to ${action.toLowerCase()} user`);
    }
  }

  return (
    <section>
      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Staff</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && data.results.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No users.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              data.results.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3">
                    {/* ✅ Clickable username */}
                    <Link
                      to={`/profile/${u.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {u.username}
                    </Link>
                  </td>
                  <td className="p-3">{u.email || "—"}</td>
                  <td className="p-3">
                    {(u.first_name || u.last_name)
                      ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                      : "—"}
                  </td>
                  <td className="p-3">
                    {u.is_active ? (
                      <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-green-700">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                        No
                      </span>
                    )}
                  </td>
                  <td className="p-3">{u.is_staff ? "Yes" : "No"}</td>
                  <td className="p-3">
                    {u.is_superuser ? (
                      <span className="text-xs text-gray-500">Superuser</span>
                    ) : (
                      <button
                        className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => onToggleActive(u)}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    )}
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
