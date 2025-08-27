// src/pages/PostDetail.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getPost, updatePost, deletePost } from "../api/posts";
import type { Post} from "../api/posts";

import PostEditor from "../components/posts/PostEditor";
import PostCard from "../components/posts/PostCard";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await getPost(postId);
      setPost(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load post");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isNaN(postId)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  if (loading) {
    return <div className="p-4 text-slate-500">Loading...</div>;
  }
  if (error || !post) {
    return (
      <div className="p-4">
        <div className="mb-3 text-rose-600">{error || "Post not found"}</div>
        <Link to="/feed" className="text-blue-600 hover:underline">
          ← Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4">
        <Link to="/feed" className="text-blue-600 hover:underline">
          ← Back to Feed
        </Link>
      </div>
      <PostCard post={post} onEdit={() => setEditing(true)} onDelete={async () => {
        if (!window.confirm("Delete this post?")) return;
        await deletePost(post.id);
        navigate("/feed");
      }} />
      {editing && (
        <PostEditor
          post={post}
          onClose={() => setEditing(false)}
          onSave={async (vals) => {
            const updated = await updatePost(post.id, vals);
            setPost(updated);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
