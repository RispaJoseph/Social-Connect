import React, { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import ProfileCard from "../../components/profile/ProfileCard";
import { Link } from "react-router-dom";

type MeResponse = {
  id: number;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string | null;
  website?: string;
  location?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  visibility?: "public" | "private" | "followers_only";
};

type MiniUser = { id: number; username: string; email?: string };

const MyProfile: React.FC = () => {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [following, setFollowing] = useState<MiniUser[]>([]);
  const [followers, setFollowers] = useState<MiniUser[]>([]);

  const myUserId = useMemo(() => {
    // If backend returns id inside /auth/me/, we’ll rely on that
    return me?.id;
  }, [me]);

  const fetchMe = async () => {
    try {
      const { data } = await API.get("/auth/me/");
      setMe(data);
    } catch (e: any) {
      setErr(e.response?.data?.detail || "Failed to load profile");
    }
  };

  const fetchLists = async (uid: number) => {
    try {
      const [fo, fi] = await Promise.all([
        API.get(`/auth/followers/${uid}/`),
        API.get(`/auth/following/${uid}/`),
      ]);
      setFollowers(Array.isArray(fo.data?.results) ? fo.data.results : fo.data);
      setFollowing(Array.isArray(fi.data?.results) ? fi.data.results : fi.data);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (myUserId) fetchLists(myUserId);
  }, [myUserId]);

  // Edit form local state
  const [form, setForm] = useState({
    bio: "",
    avatar_url: "",
    website: "",
    location: "",
    visibility: "public",
  });

  useEffect(() => {
    if (me) {
      setForm({
        bio: me.bio || "",
        avatar_url: me.avatar_url || "",
        website: me.website || "",
        location: me.location || "",
        visibility: (me.visibility as any) || "public",
      });
    }
  }, [me]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      await API.patch("/auth/me/", form);
      await fetchMe();
      setEditing(false);
    } catch (e: any) {
      setErr(e.response?.data?.detail || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <ProfileCard
          username={me?.username}
          email={me?.email}
          avatar_url={me?.avatar_url}
          bio={me?.bio}
          website={me?.website}
          location={me?.location}
          followers_count={me?.followers_count}
          following_count={me?.following_count}
          posts_count={me?.posts_count}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing((v) => !v)}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
              <Link
                to="/change-password"
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                Change Password
              </Link>
            </div>
          }
        />

        {editing && (
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow p-5 space-y-4">
            {err && <p className="text-red-600">{err}</p>}

            <div>
              <label className="block text-sm font-medium mb-1">Avatar URL</label>
              <input
                name="avatar_url"
                value={form.avatar_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border rounded p-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste a direct image URL (your backend currently expects a URL).  
                (We can add a real file upload later.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                maxLength={160}
                className="w-full border rounded p-2"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">{form.bio.length}/160</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Visibility</label>
              <select
                name="visibility"
                value={form.visibility}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="followers_only">Followers Only</option>
              </select>
            </div>

            <button
              disabled={saving}
              className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>

      <aside className="space-y-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-3">Following</h3>
          {following?.length ? (
            <ul className="space-y-2">
              {following.map((u) => (
                <li key={u.id}>
                  <Link className="text-indigo-700 hover:underline" to={`/users/${u.id}`}>
                    {u.username}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No following yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-3">Followers</h3>
          {followers?.length ? (
            <ul className="space-y-2">
              {followers.map((u) => (
                <li key={u.id}>
                  <Link className="text-indigo-700 hover:underline" to={`/users/${u.id}`}>
                    {u.username}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No followers yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
};

export default MyProfile;
