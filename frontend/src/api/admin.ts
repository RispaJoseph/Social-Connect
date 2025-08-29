// import { api } from '../lib/api'

// export async function adminUsers() { const { data } = await api.get('/admin/users/'); return data }
// export async function adminUserDetail(id:number) { const { data } = await api.get(`/admin/users/${id}/`); return data }
// export async function adminDeactivateUser(id:number) { const { data } = await api.post(`/admin/users/${id}/deactivate/`); return data }
// export async function adminPosts() { const { data } = await api.get('/admin/posts/'); return data }
// export async function adminDeletePost(id:number) { const { data } = await api.delete(`/admin/posts/${id}/`); return data }
// export async function adminStats() { const { data } = await api.get('/admin/stats/'); return data }




// src/api/admin.ts
import { api } from "../lib/api";


export interface AdminPagedResponse<T> {
  results: T[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
}

export interface AdminPost {
  id: number;
  author: string;       // from serializer (StringRelatedField)
  content: string;
  created_at: string;   // ISO
  updated_at?: string;  // ISO
}

export interface AdminStats {
  total_users: number;
  total_posts: number;
  active_today: number;
}

export type ListParams = {
  page?: number;
  page_size?: number;
  // backend doesn’t implement search yet; keeping q for future compatibility
  q?: string;
};

export async function listUsers(params: ListParams = {}) {
  const { data } = await api.get<AdminPagedResponse<AdminUser>>("/admin/users/", { params });
  return data;
}

export async function getUser(userId: number) {
  const { data } = await api.get<AdminUser>(`/admin/users/${userId}/`);
  return data;
}

export async function deactivateUser(userId: number) {
  const { data } = await api.post<{ detail: string }>(`/admin/users/${userId}/deactivate/`, {});
  return data;
}

export async function listPosts(params: ListParams = {}) {
  const { data } = await api.get<AdminPagedResponse<AdminPost>>("/admin/posts/", { params });
  return data;
}

export async function deletePost(postId: number) {
  // DRF returns 204 with body {} in your view
  const { data } = await api.delete<{}>(`/admin/posts/${postId}/`);
  return data;
}

export async function getStats() {
  const { data } = await api.get<AdminStats>("/admin/stats/");
  return data;
}

