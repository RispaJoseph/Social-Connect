import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/axios";
import ProfileCard from "../../components/profile/ProfileCard";

type PublicProfile = {
  id: number;
  bio?: string;
  avatar_url?: string | null;
  website?: string;
  location?: string;
  visibility?: "public" | "private" | "followers_only";
  followers_count: number;
  following_count: number;
  posts_count: number;
  user?: { id: number; username: string; email?: string }; // if your serializer exposes nested user
};

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [err, setErr] = useState("");
  const [toggling, setToggling] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get(`/auth/${userId}/`);
      setProfile(data);
    } catch (e: any) {
      setErr(e.response?.data?.detail || "Failed to load profile");
    }
  };

  useEffect(() => {
  if (!userId) return;
  const run = async () => {
    try {
      const { data } = await API.get(`/auth/${userId}/`);
      setProfile(data);
    } catch (e: any) {
      setErr(e.response?.data?.detail || "Failed to load profile");
    }
  };
  run();
}, [userId]);


  const follow = async () => {
    if (!userId) return;
    setToggling(true);
    try {
      await API.post(`/auth/follow/${userId}/`);
      await fetchProfile();
    } finally {
      setToggling(false);
    }
  };

  const unfollow = async () => {
    if (!userId) return;
    setToggling(true);
    try {
      await API.post(`/auth/unfollow/${userId}/`);
      await fetchProfile();
    } finally {
      setToggling(false);
    }
  };

  // We don’t know from your serializer whether current user is following the target.
  // If you add an `is_following` boolean to this response, you can flip the button easily.
  // For now, just show both actions as demo OR hide them based on your own state/logic.
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {err && <p className="text-red-600">{err}</p>}
      {profile ? (
        <ProfileCard
          username={profile.user?.username}
          email={profile.user?.email}
          avatar_url={profile.avatar_url}
          bio={profile.bio}
          website={profile.website}
          location={profile.location}
          followers_count={profile.followers_count}
          following_count={profile.following_count}
          posts_count={profile.posts_count}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={follow}
                disabled={toggling}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Follow
              </button>
              <button
                onClick={unfollow}
                disabled={toggling}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
              >
                Unfollow
              </button>
            </div>
          }
        />
      ) : (
        <div className="text-gray-600">Loading…</div>
      )}
    </div>
  );
};

export default UserProfile;
