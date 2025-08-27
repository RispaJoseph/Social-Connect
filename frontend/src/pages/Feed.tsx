// src/pages/Feed.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../api/axios";

type Visibility = "public" | "private" | "followers_only";

type Profile = {
  id: number;
  username?: string;
  email?: string;
  bio?: string;
  avatar_url?: string | null;
  website?: string;
  location?: string;
  visibility?: Visibility;
  followers_count?: number;
  following_count?: number;
};

type ProfileCache = Record<number, Profile | { error: number }>;

type Post = {
  id: number;
  author: number;
  author_username: string;
  content: string;
  image_url?: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author_profile?: {
    avatar_url?: string | null;
    bio?: string;
    followers_count?: number;
    following_count?: number;
  };
};

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=U&background=E2E8F0&color=334155";

const Feed: React.FC = () => {
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");

  // avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string>("");

  // posts + author profile cache
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [profiles, setProfiles] = useState<ProfileCache>({});

  const visibleName = useMemo(() => myProfile?.username ?? "—", [myProfile]);

  // -------- API calls --------
  const fetchProfile = useCallback(async () => {
    try {
      const res = await API.get<Profile>("/auth/me/");
      setMyProfile(res.data);
    } catch (e: any) {
      console.error("Failed to fetch profile:", e?.response?.data || e?.message);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const res = await API.get<Post[]>("/posts/");
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error("Failed to fetch posts:", e?.response?.data || e?.message);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // fetch missing author profiles (client-side join)
  const hydrateAuthorProfiles = useCallback(
    async (sourcePosts: Post[]) => {
      const authorIds = sourcePosts.map((p) => p.author);
      const unique = Array.from(new Set(authorIds));
      const missing = unique.filter((uid) => profiles[uid] === undefined);
      if (missing.length === 0) return;

      const results = await Promise.all(
        missing.map(async (uid) => {
          try {
            const res = await API.get<Profile>(`/users/${uid}/`);
            return [uid, res.data] as const;
          } catch (err: any) {
            const status = err?.response?.status ?? 0;
            return [uid, { error: status }] as const; // 403/404/etc
          }
        })
      );

      setProfiles((prev) => {
        const copy: ProfileCache = { ...prev };
        for (const [uid, prof] of results) copy[uid] = prof as any;
        return copy;
      });
    },
    [profiles]
  );

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchProfile, fetchPosts]);

  useEffect(() => {
    if (posts.length) hydrateAuthorProfiles(posts);
  }, [posts, hydrateAuthorProfiles]);

  // -------- Save profile (left pane form) --------
  const onSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!myProfile) return;
    setSaving(true);
    setSaveError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      bio: (form.get("bio") || "") as string,
      website: (form.get("website") || "") as string,
      location: (form.get("location") || "") as string,
      visibility: (form.get("visibility") || "public") as Visibility,
    };

    try {
      const res = await API.patch<Profile>("/auth/me/", payload);
      setMyProfile(res.data);
      setEditing(false);
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      setSaveError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // -------- Avatar upload --------
  const onPickAvatar: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setUploadMsg("");
    const file = e.target.files?.[0] || null;
    setAvatarFile(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } else {
      setAvatarPreview(null);
    }
  };

  const onUploadAvatar = async () => {
    if (!avatarFile) {
      setUploadMsg("Please choose an image first.");
      return;
    }

    // optional client-side validations
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(avatarFile.type)) {
      setUploadMsg("Please upload a JPG/PNG/WebP image.");
      return;
    }
    if (avatarFile.size > 2 * 1024 * 1024) {
      setUploadMsg("Avatar too large (max 2MB).");
      return;
    }

    setUploadingAvatar(true);
    setUploadMsg("");

    try {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      const res = await API.post<{ avatar_url: string }>("/auth/me/avatar/", fd);

      setMyProfile((prev) =>
        prev ? { ...prev, avatar_url: res.data.avatar_url } : prev
      );
      setAvatarFile(null);
      setAvatarPreview(null);
      setUploadMsg("Avatar updated!");
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      setUploadMsg("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // -------- Logout --------
  const onLogout = () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } catch {}
    setMyProfile(null);
    // Adjust this path if your login route is different
    window.location.href = "/Login";
  };

  // -------- Render helpers --------
  const renderAuthorAvatar = (post: Post) => {
    const cached = profiles[post.author] as Profile | { error: number } | undefined;
    const blocked = (cached as any)?.error === 403;

    if (blocked) {
      return (
        <img
          src={DEFAULT_AVATAR}
          alt="author"
          className="w-10 h-10 rounded-full object-cover border"
        />
      );
    }

    const url =
      post.author_profile?.avatar_url ||
      (cached as Profile)?.avatar_url ||
      DEFAULT_AVATAR;

    return (
      <img
        src={url || DEFAULT_AVATAR}
        alt="author"
        className="w-10 h-10 rounded-full object-cover border"
      />
    );
  };

  const renderAuthorName = (post: Post) => {
    const cached = profiles[post.author] as Profile | { error: number } | undefined;
    const blocked = (cached as any)?.error === 403;
    if (blocked) return "Private user";
    return post.author_username || (cached as Profile)?.username || "—";
  };

  // -------- JSX --------
  return (
    <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 px-4">
      {/* Left: Profile card */}
      <aside className="md:col-span-4 lg:col-span-3">
        <div className="rounded-xl border bg-white shadow-sm p-5">
          {/* Avatar + uploader */}
          <div className="flex items-start gap-4">
            <img
              src={avatarPreview || myProfile?.avatar_url || DEFAULT_AVATAR}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover border"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Change avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={onPickAvatar}
                className="block w-full text-sm file:mr-3 file:py-2 file:px-3
                           file:rounded-md file:border-0 file:text-sm file:font-semibold
                           file:bg-slate-100 hover:file:bg-slate-200"
              />
              {avatarPreview && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={onUploadAvatar}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadingAvatar ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarFile(null);
                      setUploadMsg("");
                    }}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {uploadMsg && (
                <p className="text-xs mt-2 text-slate-600">{uploadMsg}</p>
              )}
            </div>
          </div>

          {/* Profile basics */}
          <div className="mt-4">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="font-semibold text-slate-800">{visibleName}</p>
          </div>

          {/* Edit / view */}
          {!editing ? (
            <>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Bio</dt>
                  <dd className="text-right text-slate-800 max-w-[60%]">
                    {myProfile?.bio || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Website</dt>
                  <dd className="text-right text-blue-700 max-w-[60%] truncate">
                    {myProfile?.website ? (
                      <a href={myProfile.website} target="_blank" rel="noreferrer">
                        {myProfile.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="text-right text-slate-800 max-w-[60%]">
                    {myProfile?.location || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Visibility</dt>
                  <dd className="text-right text-slate-800">
                    {myProfile?.visibility || "public"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                >
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={onSaveProfile} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Bio</label>
                <textarea
                  name="bio"
                  defaultValue={myProfile?.bio || ""}
                  maxLength={160}
                  rows={3}
                  className="w-full rounded-md border p-2 text-sm"
                  placeholder="Say something nice…"
                />
                <div className="text-xs text-slate-500 mt-1">
                  {(myProfile?.bio?.length ?? 0)}/160
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Website
                </label>
                <input
                  name="website"
                  type="url"
                  defaultValue={myProfile?.website || ""}
                  className="w-full rounded-md border p-2 text-sm"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Location
                </label>
                <input
                  name="location"
                  type="text"
                  defaultValue={myProfile?.location || ""}
                  className="w-full rounded-md border p-2 text-sm"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Visibility
                </label>
                <select
                  name="visibility"
                  defaultValue={myProfile?.visibility || "public"}
                  className="w-full rounded-md border p-2 text-sm"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="followers_only">Followers Only</option>
                </select>
              </div>

              {saveError && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  disabled={saving}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setSaveError("");
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Stats */}
          <div className="mt-6 border-t pt-4 grid grid-cols-3 text-center">
            <div>
              <div className="text-lg font-semibold">
                {/* {myProfile?.posts_count ?? 0} */}
              </div>
              <div className="text-xs text-slate-500">Posts</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {myProfile?.followers_count ?? 0}
              </div>
              <div className="text-xs text-slate-500">Followers</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {myProfile?.following_count ?? 0}
              </div>
              <div className="text-xs text-slate-500">Following</div>
            </div>
          </div>

          {/* Logout button */}
          <div className="mt-6">
            <button
              onClick={onLogout}
              className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Center: Posts */}
      <main className="md:col-span-8 lg:col-span-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Feed</h1>

        {loadingPosts ? (
          <div className="text-slate-500">Loading posts…</div>
        ) : posts.length === 0 ? (
          <div className="text-slate-500">No posts yet</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-xl border bg-white shadow-sm p-4"
              >
                <header className="flex items-center gap-3 mb-2">
                  {renderAuthorAvatar(post)}
                  <div>
                    <div className="font-semibold text-slate-900">
                      {renderAuthorName(post)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                </header>

                <p className="text-slate-800 whitespace-pre-wrap">{post.content}</p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="post"
                    className="mt-3 rounded-lg border"
                  />
                )}

                <footer className="mt-3 text-sm text-slate-600 flex items-center gap-4">
                  <span>❤ {post.like_count}</span>
                  <span>💬 {post.comment_count}</span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Right: Optional */}
      <aside className="hidden lg:block lg:col-span-3">
        <div className="rounded-xl border bg-white shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-2">
            Welcome, {visibleName}
          </h3>
          <p className="text-sm text-slate-600">
            Your personalized feed is on the way.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default Feed;
