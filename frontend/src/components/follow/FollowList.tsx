// src/components/follow/FollowList.tsx
import { useEffect, useState } from "react";
import { getMe } from "../../api/users";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Avatar } from "../Avatar";
import FollowButton from "./FollowButton";
import { Link } from "react-router-dom";

type UserLite = {
  id: number;
  username: string;
  avatar_url?: string | null;
};

export default function FollowList() {
  const [followers, setFollowers] = useState<UserLite[]>([]);
  const [following, setFollowing] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();

        // Followers
        const fRes = await api.get(`/auth/followers/${me.id}/`);
        const flist = normalizeList(fRes.data);
        setFollowers(flist);

        // Following
        const gRes = await api.get(`/auth/following/${me.id}/`);
        const glist = normalizeList(gRes.data);
        setFollowing(glist);
      } catch (e) {
        toast.error("Failed to load follow lists");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function normalizeList(raw: any): UserLite[] {
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
    return arr.map((x: any) => {
      const u = x?.user || x?.follower || x?.following || x;
      return {
        id: u.id,
        username: u.username,
        avatar_url: u.avatar_url ?? null,
      };
    });
  }

  if (loading) return <div className="text-sm text-gray-600">Loading network…</div>;

  return (
    <div className="bg-white border rounded-2xl p-4 space-y-6">
      <section>
        <h2 className="font-semibold mb-2">Followers</h2>
        {followers.length === 0 ? (
          <p className="text-sm text-gray-600">No one follows you yet.</p>
        ) : (
          <ul className="space-y-3">
            {followers.map((u) => (
              <li key={u.id} className="flex items-center justify-between">
                <Link to={`/profile/${u.id}`} className="flex items-center gap-2 min-w-0">
                  <Avatar src={u.avatar_url} name={u.username} />
                  <span className="truncate text-sm hover:underline">{u.username}</span>
                </Link>
                <FollowButton userId={u.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Following</h2>
        {following.length === 0 ? (
          <p className="text-sm text-gray-600">You aren’t following anyone yet.</p>
        ) : (
          <ul className="space-y-3">
            {following.map((u) => (
              <li key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar src={u.avatar_url} name={u.username} />
                  <span className="text-sm">{u.username}</span>
                </div>
                <FollowButton userId={u.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
