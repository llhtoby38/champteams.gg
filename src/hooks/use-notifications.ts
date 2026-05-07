'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuthSession } from '@/hooks/use-local-storage';

export interface NotificationItem {
  id: string;
  type: 'comment' | 'reply' | 'like' | 'tier-list' | 'announcement' | 'follow-cta';
  title: string;
  body: string | null;
  link: string | null;
  actorName: string | null;
  teamId: string | null;
  readAt: string | null;
  createdAt: string;
}

export function useNotifications() {
  const [session, setSession] = useState<{ userId: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = getAuthSession();
    return s ? { userId: s.userId } : null;
  });
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const handler = () => {
      const s = getAuthSession();
      setSession(prev => {
        const next = s ? { userId: s.userId } : null;
        if (prev?.userId === next?.userId) return prev;
        return next;
      });
    };
    window.addEventListener('local-storage-sync', handler);
    return () => window.removeEventListener('local-storage-sync', handler);
  }, []);

  const fetchNotifs = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-id': session.userId },
      });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch { /* ignore */ }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifs();
    const t = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(t);
  }, [session, fetchNotifs]);

  const markAllRead = useCallback(async () => {
    if (!session || unread === 0) return;
    setUnread(0);
    setItems(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
        body: JSON.stringify({}),
      });
    } catch { /* ignore */ }
  }, [session, unread]);

  const markRead = useCallback(async (id: string) => {
    if (!session) return;
    setUnread(c => Math.max(0, c - 1));
    setItems(prev => prev.map(x => x.id === id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x));
    fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});
  }, [session]);

  return { session, items, unread, markAllRead, markRead, refetch: fetchNotifs };
}
