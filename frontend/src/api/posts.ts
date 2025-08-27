// src/api/posts.ts
import API from "./axios";

export type PostCategory = "general" | "announcement" | "question";

export interface Post {
  id: number;
  content: string;
  author: number;
  author_username: string;
  created_at: string; // ISO
  updated_at?: string; // ISO
  image_url?: string | null;
  category: PostCategory;
  is_active: boolean;
  like_count: number;
  comment_count: number;
  author_profile?: {
    avatar_url?: string | null;
  };
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ListPostsParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: PostCategory;
  author?: number | "me";
}

export async function listPosts(params: ListPostsParams = {}) {
  const res = await API.get<Paginated<Post>>("/posts/", { params });
  return res.data;
}

export async function getPost(id: number) {
  const res = await API.get<Post>(`/posts/${id}/`);
  return res.data;
}

/** ---------- NEW: createPost ---------- */
export type CreatePostPayload = {
  content: string;
  category?: PostCategory;
  image?: File | null; // pass a File to upload, omit/undefined for none
};

export async function createPost(payload: CreatePostPayload) {
  const fd = new FormData();
  fd.append("content", payload.content);
  if (payload.category) fd.append("category", payload.category);
  if (payload.image instanceof File) {
    fd.append("image", payload.image); // field name 'image' — keep consistent with backend
  }
  const res = await API.post<Post>("/posts/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
/** ------------------------------------- */

type UpdatePayload = {
  content?: string;
  category?: PostCategory;
  image?: File | null;     // File to replace image, null to remove, undefined to leave unchanged
  remove_image?: boolean;  // optional explicit flag if your backend supports it
};

export async function updatePost(id: number, payload: UpdatePayload) {
  const { content, category, image, remove_image } = payload;

  // If image is being changed or you need to send remove flags, use FormData
  if (image !== undefined || remove_image) {
    const form = new FormData();
    if (content !== undefined) form.append("content", content);
    if (category !== undefined) form.append("category", category);

    if (remove_image) {
      form.append("remove_image", "true");
    } else if (image instanceof File) {
      form.append("image", image);
    } else if (image === null) {
      // If your backend treats empty string as remove, keep this; otherwise rely on remove_image flag
      form.append("image", "");
    }

    const res = await API.patch<Post>(`/posts/${id}/`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  // Otherwise simple JSON patch
  const body: Record<string, any> = {};
  if (content !== undefined) body.content = content;
  if (category !== undefined) body.category = category;

  const res = await API.patch<Post>(`/posts/${id}/`, body);
  return res.data;
}

export async function deletePost(id: number) {
  await API.delete(`/posts/${id}/`);
}
