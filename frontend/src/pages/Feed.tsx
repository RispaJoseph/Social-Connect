// src/pages/Feed.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API from "../api/axios";

type Visibility = "public" | "private" | "followers_only";
type PostCategory = "general" | "announcement" | "question";

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

type Post = {
  id: number;
  author: number;
  author_username: string;
  content: string;
  image_url?: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  category?: PostCategory;
  author_profile?: {
    avatar_url?: string | null;
    bio?: string;
    followers_count?: number;
    following_count?: number;
  };
};

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=U&background=E2E8F0&color=334155";

const CATEGORY_OPTIONS: { value: PostCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "announcement", label: "Announcement" },
  { value: "question", label: "Question" },
];

// ----------------------
// Inline Post Composer
// ----------------------
function PostComposer({ onCreated }: { onCreated: (post: Post) => void }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("general");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const remaining = 280 - content.length;

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return setFile(null);
    const allowed = ["image/jpeg", "image/png"];
    if (!allowed.includes(f.type)) {
      setError("Only JPEG and PNG images are allowed.");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setError("Image too large (max 2MB).");
      return;
    }
    setError("");
    setFile(f);
  };

  const submit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) return setError("Write something…");
    if (content.length > 280) return setError("Post exceeds 280 characters.");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("content", content);
      fd.append("category", category);
      if (file) fd.append("upload_image", file);
      // await API.post("/posts/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      // If your backend requires new posts to be active to show in lists:
      // fd.append("is_active", "true"); // <-- UNCOMMENT ONLY if your model has this field

      const res = await API.post<Post>("/posts/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("[Create] response post:", res.data);
      onCreated(res.data);
      setContent("");
      setCategory("general");
      setFile(null);
    } catch (err: any) {
      console.error(err?.response?.data || err?.message);
      setError(err?.response?.data?.detail || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl p-4 border shadow-sm bg-white mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={280}
        rows={3}
        placeholder="What's happening?"
        className="w-full p-3 border rounded-lg"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Category:{" "}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PostCategory)}
            className="border rounded px-2 py-1"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={onFileChange}
          className="text-sm"
        />

        <span className={`ml-auto text-sm ${remaining < 0 ? "text-red-600" : "text-gray-500"}`}>
          {remaining} remaining
        </span>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>

      {file && (
        <div className="text-sm text-gray-600 mt-2">
          Selected: {file.name} ({Math.round(file.size / 1024)} KB)
        </div>
      )}
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
    </form>
  );
}

// ----------------------
// Feed Page
// ----------------------
const Feed: React.FC = () => {
  const navigate = useNavigate();

  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string>("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // my posts count
  const [myPostsCount, setMyPostsCount] = useState<number | null>(null);

  const visibleName = useMemo(() => myProfile?.username ?? "—", [myProfile]);

  // If no token, go to login early
  useEffect(() => {
    const token = (() => {
      try {
        return localStorage.getItem("accessToken");
      } catch {
        return null;
      }
    })();
    if (!token) navigate("/login");
  }, [navigate]);

  // Stable handler for 401s
  const handleAuthError = useCallback(
    (e: any) => {
      if (e?.response?.status === 401) navigate("/login");
    },
    [navigate]
  );

  // -------- API calls --------
  const fetchProfile = useCallback(async () => {
    try {
      const res = await API.get<Profile>("/auth/me/");
      setMyProfile(res.data);
    } catch (e: any) {
      console.error("Failed to fetch profile:", e?.response?.data || e?.message);
      handleAuthError(e);
    }
  }, [handleAuthError]);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const pickResults = (data: any): Post[] =>
        Array.isArray(data) ? data : (data?.results ?? []);

      // A) personalized feed
      const feedRes = await API.get<any>("/posts/feed/", {
        params: { page: 1, page_size: 10, ordering: "-created_at" },
      });
      const feedItems = pickResults(feedRes.data);
      console.log("[List A] /posts/feed ->", feedRes.data);

      if (feedItems && feedItems.length > 0) {
        setPosts(feedItems);
        return;
      }

      // B) all posts
      const allRes = await API.get<any>("/posts/", {
        params: { page: 1, page_size: 10, ordering: "-created_at" },
      });
      const allItems = pickResults(allRes.data);
      console.log("[List B] /posts ->", allRes.data);

      if (allItems && allItems.length > 0) {
        setPosts(allItems);
        return;
      }

      // C) my posts by numeric id (if profile loaded)
      if (myProfile?.id) {
        const mineRes = await API.get<any>("/posts/", {
          params: { author: myProfile.id, page: 1, page_size: 10, ordering: "-created_at" },
        });
        const mineItems = pickResults(mineRes.data);
        console.log("[List C] /posts?author=", myProfile.id, "->", mineRes.data);

        setPosts(mineItems || []);
        return;
      }

      setPosts([]);
    } catch (e: any) {
      console.error("[List] error:", e?.response?.data || e?.message);
      handleAuthError(e);
    } finally {
      setLoadingPosts(false);
    }
  }, [handleAuthError, myProfile?.id]);

  // fetch only the count of my posts (numeric id only) + log
  const fetchMyPostsCount = useCallback(
    async (userId: number) => {
      try {
        const res = await API.get<{ count?: number; results?: any[] }>("/posts/", {
          params: { author: userId, page: 1, page_size: 1 },
        });
        console.log("[Count] /posts?author=", userId, "->", res.data);

        const cnt =
          typeof res.data?.count === "number"
            ? res.data.count
            : Array.isArray(res.data)
            ? res.data.length
            : (res.data?.results?.length ?? 0);

        setMyPostsCount(cnt);
      } catch (e: any) {
        console.error("[Count] error:", e?.response?.data || e?.message);
        handleAuthError(e);
        setMyPostsCount(null);
      }
    },
    [handleAuthError]
  );

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchProfile, fetchPosts]);

  // trigger count after profile is known
  useEffect(() => {
    if (myProfile?.id) {
      fetchMyPostsCount(myProfile.id);
    }
  }, [myProfile?.id, fetchMyPostsCount]);

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
      handleAuthError(err);
    } finally {
      setSaving(false);
    }
  };

  // -------- Avatar upload --------
  const onPickAvatar: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setUploadMsg("");
    const file = e.target.files?.[0] || null;
    setAvatarFile(file || null);
    if (file) setAvatarPreview(URL.createObjectURL(file));
    else setAvatarPreview(null);
  };

  const onUploadAvatar = async () => {
    if (!avatarFile) return setUploadMsg("Please choose an image first.");

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
      handleAuthError(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // -------- Logout --------
  const onLogout = () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } catch {}
    setMyProfile(null);
    window.location.href = "/login";
  };

  // -------- Render helpers --------
  const renderAuthorAvatar = (post: Post) => {
    const url = post.author_profile?.avatar_url || DEFAULT_AVATAR;
    return (
      <img
        src={url || DEFAULT_AVATAR}
        alt="author"
        className="w-10 h-10 rounded-full object-cover border"
      />
    );
  };

  const renderAuthorName = (post: Post) => {
    return post.author_username || "—";
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

              {saveError && <p className="text-sm text-red-600">{saveError}</p>}

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
              <Link to="/me/posts" className="group inline-block">
                <div className="text-lg font-semibold group-hover:underline">
                  {myPostsCount ?? "—"}
                </div>
                <div className="text-xs text-slate-500">Posts</div>
              </Link>
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

        <PostComposer
          onCreated={async (post) => {
            console.log("[Create] response post:", post); // 🔍
            // show newly created post immediately
            setPosts((prev) => [post, ...prev]);
            // bump my posts count in the sidebar
            setMyPostsCount((c) => (typeof c === "number" ? c + 1 : 1));
            // refresh feed from server as well (keeps pagination/ordering correct)
            await fetchPosts();
          }}
        />

        {loadingPosts ? (
          <div className="text-slate-500">Loading posts…</div>
        ) : posts.length === 0 ? (
          <div className="text-slate-500">No posts yet</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border bg-white shadow-sm p-4">
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
                  {post.category && (
                    <span className="ml-auto text-xs px-2 py-1 rounded bg-gray-100">
                      {post.category}
                    </span>
                  )}
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
