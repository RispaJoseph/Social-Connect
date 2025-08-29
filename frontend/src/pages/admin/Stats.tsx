// src/pages/admin/Stats.tsx
import { useEffect, useState } from "react";
import { getStats, type AdminStats } from "../../api/admin";

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await getStats();
        if (!active) return;
        setStats(s);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="text-sm text-gray-600">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!stats) return <div className="text-sm text-gray-600">No data.</div>;

  const Card = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-lg border p-6 bg-white">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card label="Total Users" value={stats.total_users} />
      <Card label="Total Posts" value={stats.total_posts} />
      <Card label="Active Today" value={stats.active_today} />
    </section>
  );
}
