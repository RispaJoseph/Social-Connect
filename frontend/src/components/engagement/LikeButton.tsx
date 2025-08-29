// src/components/engagement/LikeButton.tsx
import { useEffect, useState } from "react";
import { getLikeStatus, toggleLike, getPost } from "../../api/posts";
import { toast } from "sonner";

export default function LikeButton({
  postId,
  initialCount,
  onCountChange,
}: {
  postId: number;
  initialCount: number;
  onCountChange?: (next: number, liked: boolean) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // verify post exists
        await getPost(postId);
        const { liked } = await getLikeStatus(postId);
        if (!mounted) return;
        setLiked(liked);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          if (!mounted) return;
          setGone(true);
          setLiked(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [postId]);

  async function toggle() {
    if (busy || loading || gone) return;
    setBusy(true);

    const prevLiked = liked;
    setLiked(!prevLiked);
    setCount((c) => c + (prevLiked ? -1 : 1));
    onCountChange?.(count + (prevLiked ? -1 : 1), !prevLiked);

    try {
      const res = await toggleLike(postId);
      if (typeof res.like_count === "number") {
        setCount(res.like_count);
        setLiked(res.detail === "Liked");
        onCountChange?.(res.like_count, res.detail === "Liked");
      }
    } catch {
      // revert if failed
      setLiked(prevLiked);
      setCount((c) => c + (prevLiked ? 1 : -1));
      toast.error("Failed to update like");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || busy || gone}
      className={`text-sm px-2 py-1 rounded border ${
        liked ? "bg-red-50" : ""
      } disabled:opacity-50`}
      title={gone ? "Post not available" : liked ? "Unlike" : "Like"}
    >
      {liked ? "❤️" : "🤍"} {count}
    </button>
  );
}
