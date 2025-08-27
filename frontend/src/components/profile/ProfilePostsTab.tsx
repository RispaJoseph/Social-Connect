// src/components/profile/ProfilePostsTab.tsx
import React from "react";
import PostList from "../posts/PostList";
import { useAuthUserId } from "../../hooks/useAuthUser";

export default function ProfilePostsTab() {
  const userId = useAuthUserId();

  if (!userId) {
    return (
      <div className="rounded-2xl border p-6 text-slate-600">
        Please sign in to view your posts.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PostList initialParams={{ page_size: 10, author: userId }} showFilters={false} />
    </div>
  );
}
