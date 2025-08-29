// src/api/relations.ts
import { api } from "../lib/api";

export interface UserLite {
  id: number;
  username: string;
  avatar_url?: string | null;
}

export interface PagedResponse<T> {
  results: T[];
  next?: string | null;
  previous?: string | null;
  count?: number;
}

export async function getFollowers(userId: number, page = 1, page_size = 20) {
  const { data } = await api.get<PagedResponse<UserLite>>(`/auth/followers/${userId}/`, {
    params: { page, page_size },
  });
  return data;
}

export async function getFollowing(userId: number, page = 1, page_size = 20) {
  const { data } = await api.get<PagedResponse<UserLite>>(`/auth/following/${userId}/`, {
    params: { page, page_size },
  });
  return data;
}
