import { api } from '../lib/api'

export async function adminUsers() { const { data } = await api.get('/admin/users/'); return data }
export async function adminUserDetail(id:number) { const { data } = await api.get(`/admin/users/${id}/`); return data }
export async function adminDeactivateUser(id:number) { const { data } = await api.post(`/admin/users/${id}/deactivate/`); return data }
export async function adminPosts() { const { data } = await api.get('/admin/posts/'); return data }
export async function adminDeletePost(id:number) { const { data } = await api.delete(`/admin/posts/${id}/`); return data }
export async function adminStats() { const { data } = await api.get('/admin/stats/'); return data }
