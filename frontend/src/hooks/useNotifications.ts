// src/hooks/useNotifications.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "../api/notifications";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export function useNotifications(recipientId: string | number | undefined) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(recipientId));
  const [error, setError] = useState<string | null>(null);
  const [page] = useState(1);
  const [pageSize] = useState(20);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscribed = useRef(false);

  const load = useCallback(async () => {
    if (!recipientId) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listNotifications(page, pageSize);
      const results = Array.isArray(data) ? data : (data?.results ?? []);
      setItems(results);
      const unread = results.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0);
      setUnreadCount(unread);
    } catch (e) {
      console.error("Failed to load notifications:", e);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [recipientId, page, pageSize]);

  // Load whenever recipientId becomes available
  useEffect(() => {
    if (!recipientId) {
      setLoading(false);
      return;
    }
    load();
  }, [recipientId, load]);

  // Realtime subscription
  useEffect(() => {
    if (!recipientId || subscribed.current) return;
    subscribed.current = true;

    const channel = supabase
      .channel(`notifications:${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient=eq.${recipientId}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev]);
          setUnreadCount((c) => c + (n.is_read ? 0 : 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscribed.current = false;
    };
  }, [recipientId]);

  const markOneRead = useCallback(async (id: number | string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
      setUnreadCount((c) => c + 1);
    }
  }, []);

  const markAll = useCallback(async () => {
    const prev = items;
    const prevUnread = unreadCount;
    setItems((p) => p.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setItems(prev);
      setUnreadCount(prevUnread);
    }
  }, [items, unreadCount]);

  return useMemo(
    () => ({ items, loading, error, unreadCount, markOneRead, markAll, reload: load }),
    [items, loading, error, unreadCount, markOneRead, markAll, load]
  );
}

export function formatTimeAgo(iso: string) {
  const date = new Date(iso);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  const steps: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let val = diff, label = "s";
  for (const [step, l] of steps) {
    if (val < step) { label = l; break; }
    val = Math.floor(val / step);
    label = l;
  }
  return `${val}${label}`;
}
