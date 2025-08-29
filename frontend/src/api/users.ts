// src/api/users.ts
import { api } from '../lib/api'

export interface Me {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string | null
  bio?: string | null
  website?: string | null
  location?: string | null
  visibility?: 'public' | 'private' | 'followers_only'
  followers_count?: number
  following_count?: number
  posts_count?: number
}

export async function getMe(): Promise<Me> {
  const { data } = await api.get('/auth/me/')
  return data
}

export async function updateMe(payload: Partial<Me>) {
  const { data } = await api.patch('/auth/me/', payload)
  return data as Me
}

export async function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('avatar', file)
  const { data } = await api.post('/auth/me/avatar/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data as { avatar_url: string }
}

// ---- Follow APIs ----
export type LiteUser = { id: number; username: string; email?: string }

export async function followUser(userId: number) {
  const { data } = await api.post(`/auth/follow/${userId}/`)
  return data as { message: string }
}

export async function unfollowUser(userId: number) {
  const { data } = await api.post(`/auth/unfollow/${userId}/`)
  return data as { message: string }
}

export async function getFollowers(userId: number) {
  const { data } = await api.get(`/auth/followers/${userId}/`)
  // Normalize pagination -> array
  return Array.isArray(data) ? (data as LiteUser[]) : ((data?.results as LiteUser[]) || [])
}

export async function getFollowing(userId: number) {
  const { data } = await api.get(`/auth/following/${userId}/`)
  // Normalize pagination -> array
  return Array.isArray(data) ? (data as LiteUser[]) : ((data?.results as LiteUser[]) || [])
}

// Optional: view someone else's public profile by numeric id
export async function getPublicProfileById(userId: number) {
  const { data } = await api.get(`/auth/${userId}/`)
  return data 
}


export async function getPublicProfileByUsername(username: string) {
  const { data } = await api.get(`/auth/by-username/${encodeURIComponent(username)}/`)
  return data
}




export async function getSuggestions(params?: { page?: number; page_size?: number; q?: string }) {
  const { data } = await api.get("/auth/suggestions/", { params });
  return Array.isArray(data) ? data : (data?.results ?? []);
}
