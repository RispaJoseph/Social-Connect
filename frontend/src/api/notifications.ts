import { api } from '../lib/api'

export async function listNotifications() {
  const { data } = await api.get('/notifications/')
  return data
}
export async function markRead(id: number) {
  const { data } = await api.post(`/notifications/${id}/read/`)
  return data
}
export async function markAllRead() {
  const { data } = await api.post('/notifications/mark-all-read/')
  return data
}
