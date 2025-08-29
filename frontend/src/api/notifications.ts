// src/api/notifications.ts
import { api } from "../lib/api";

export type NotificationType = "follow" | "like" | "comment";

export interface UserLite {
  id: number | string;
  username: string;
  avatar_url?: string | null;
}

export interface PostLite {
  id: number | string;
  slug?: string;
}

export interface Notification {
  id: number | string;
  recipient: number | string;
  sender: UserLite;
  notification_type: NotificationType;
  post?: PostLite | null;
  message: string;
  is_read: boolean;
  created_at: string; // ISO
}

export interface NotificationListResponse {
  results: Notification[];
  next?: string | null;
  previous?: string | null;
  count?: number;
}

export async function listNotifications(page = 1, pageSize = 20) {
  const { data } = await api.get<NotificationListResponse>(
    `/notifications/?page=${page}&page_size=${pageSize}`
  );
  return data;
}

export async function markNotificationRead(id: number | string) {
  await api.post(`/notifications/${id}/read/`);
}

export async function markAllNotificationsRead() {
  await api.post(`/notifications/mark-all-read/`);
}
