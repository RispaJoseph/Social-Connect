// src/components/people/FollowersSidebar.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listFollowers, type UserLite } from "../../api/followers";
import { useAuth } from "../../auth/useAuth";
import { toast } from "sonner";

export default function FollowersSidebar() {
  const { user } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<UserLite[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!user?.id) {
        setLoading(false);
        setFollowers([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await listFollowers(user.id);
        if (mounted) setFollowers(data.results || []);
      } catch (e: any) {
        const msg =
          e?.response?.data?.detail ||
          e?.response?.statusText ||
          e?.message ||
          "Failed to load followers";
        if (mounted) {
          setError(msg);
          setFollowers([]);
        }
        toast.error(`Followers: ${msg}`);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 font-semibold">Followers</h3>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : error ? (
        <div className="text-xs text-red-600">{error}</div>
      ) : followers.length === 0 ? (
        <div className="text-sm text-gray-500">No followers yet.</div>
      ) : (
        <ul className="space-y-3">
          {followers.map((f) => (
            <li key={f.id} className="flex items-center gap-3">
              <img
                src={f.avatar_url || "https://via.placeholder.com/32?text=%F0%9F%91%A4"}
                alt=""
                className="h-8 w-8 rounded-full border object-cover"
              />
              <Link
                to={`/profile/${f.id}`}
                className="truncate hover:underline"
                title={f.username}
              >
                {f.username}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
