import { useEffect, useState } from "react";
import { getSuggestions } from "../../api/users";
import { Avatar } from "../Avatar";
import FollowButton from "./FollowButton";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type SuggestedUser = {
  id: number;
  username: string;
  avatar_url?: string | null;
};

export default function SuggestedUsers() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await getSuggestions({ page_size: 10 });
        setUsers(list);
      } catch {
        toast.error("Failed to load suggestions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-sm text-gray-600">Loading suggestions…</div>;

  return (
    <div className="bg-white border rounded-2xl p-4">
      <h3 className="font-semibold mb-3">Suggested for you</h3>

      {users.length === 0 ? (
        <div className="text-sm text-gray-600">No suggestions right now.</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3">
              <Link to={`/profile/${u.id}`} className="flex items-center gap-2 min-w-0">
                <Avatar src={u.avatar_url} name={u.username} />
                <span className="truncate text-sm hover:underline">{u.username}</span>
              </Link>
              <FollowButton userId={u.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
