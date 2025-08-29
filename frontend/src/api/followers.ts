// src/api/followers.ts
import { api } from "../lib/api";

export interface UserLite {
  id: number | string;
  username: string;
  avatar_url?: string | null;
}

export interface PagedResponse<T> {
  results: T[];
  next?: string | null;
  previous?: string | null;
  count?: number;
}

/**
 * Backend route: /api/auth/followers/<user_id>/
 * Returns a plain array of users (no pagination).
 */
export async function listFollowers(
  userId: number | string
): Promise<PagedResponse<UserLite>> {
  const { data } = await api.get(`/auth/followers/${userId}/`);
  // data is an array of users
  const results = (Array.isArray(data) ? data : []).map((u: any) => ({
    id: u.id,
    username: u.username,
    avatar_url: u.avatar_url ?? null,
  }));

  return {
    results,
    next: null,
    previous: null,
    count: results.length,
  };
}
