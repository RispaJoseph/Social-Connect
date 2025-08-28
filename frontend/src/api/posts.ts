// src/api/posts.ts
import { api } from '../lib/api'

export type PostCategory = 'general' | 'announcement' | 'question'
export interface Post {
  id: number
  content: string
  author: number
  author_username: string
  created_at: string
  updated_at?: string
  image_url?: string | null
  category: PostCategory
  is_active: boolean
  like_count: number
  comment_count: number
}

export async function getFeed(page = 1) {
  // const { data } = await api.get('/posts/feed/', { params: { page } })
  // return data as { results: Post[]; next?: string | null; previous?: string | null }
  const { data } = await api.get(`/posts/feed/?page=${page}`)
  return data
}

export async function createPostTextOnly(content: string, category: PostCategory = 'general') {
  const form = new FormData()
  form.append('content', content)
  form.append('category', category)
  const { data } = await api.post('/posts/', form)
  return data as Post
}

export async function createPost(content: string, file?: File, category: PostCategory = 'general') {
  const form = new FormData()
  form.append('content', content)
  form.append('category', category)
  if (file) form.append('upload_image', file) // ✅ must be upload_image
  const { data } = await api.post('/posts/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data as Post
}


export async function updatePost(id: number, content: string, file?: File, category?: PostCategory) {
  const form = new FormData()
  form.append('content', content)
  if (category) form.append('category', category)
  if (file) form.append('upload_image', file)
  const { data } = await api.patch(`/posts/${id}/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data as Post
}

export async function deletePost(id: number) {
  const { data } = await api.delete(`/posts/${id}/`)
  return data
}


// --- Likes ---
export async function likePost(postId: number) {
  const { data } = await api.post(`/posts/${postId}/like/`)
  return data
}

export async function unlikePost(postId: number) {
  const { data } = await api.delete(`/posts/${postId}/like/`)
  return data
}

export async function getLikeStatus(postId: number) {
  const { data } = await api.get(`/posts/${postId}/like-status/`)
  // Expecting something like { liked: boolean }
  return data as { liked: boolean }
}

// --- Comments ---
export type Comment = {
  id: number
  content: string
  author: number
  author_username?: string
  created_at: string
}

export async function getComments(postId: number) {
  const { data } = await api.get(`/posts/${postId}/comments/`)
  // If paginated, unwrap results
  return Array.isArray(data) ? (data as Comment[]) : ((data?.results as Comment[]) || [])
}

export async function addComment(postId: number, content: string) {
  const { data } = await api.post(`/posts/${postId}/comments/`, { content })
  return data as Comment
}


export async function deleteComment(commentId: number) {
  const { data } = await api.delete(`/posts/comments/${commentId}/`)
  return data
}


export async function getPost(postId: number) {
  const { data } = await api.get(`/posts/${postId}/`)
  return data as Post
}
