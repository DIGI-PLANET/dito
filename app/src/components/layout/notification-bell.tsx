'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useI18n } from '@/providers/i18n-provider';
import { t } from '@/lib/i18n';
import { getSignMessage } from '@/lib/store';
import { getAuthParams } from '@/lib/wallet-auth';
import { getWalletCookie } from '@/lib/wallet-cookie';

interface Notification {
  id: string;
  type: 'streakReminder' | 'streakCelebration' | 'soulMintReady' | 'decayWarning';
  read: boolean;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWallet(): string | null {
  return getWalletCookie();
}

function generateNotifications(): Notification[] {
  // Notifications are now generated server-side or from DB
  // This is a no-op fallback
  return [];
}

async function fetchSupabaseNotifications(wallet: string): Promise<Notification[]> {
  try {
    const signMessageFn = getSignMessage();
    let qs = `wallet_address=${encodeURIComponent(wallet)}`;
    if (signMessageFn) {
      try {
        const auth = await getAuthParams(wallet, signMessageFn);
        qs += `&signature=${encodeURIComponent(auth.signature)}&auth_message=${encodeURIComponent(auth.auth_message)}&auth_timestamp=${auth.auth_timestamp}`;
      } catch { /* fallback */ }
    }
    const res = await fetch(`/api/notifications?${qs}`);
    const { notifications } = await res.json();
    if (!notifications || notifications.length === 0) return [];
    return notifications.map((n: Record<string, unknown>) => ({
      id: n.id as string,
      type: n.type as Notification['type'],
      read: n.read as boolean,
    }));
  } catch {
    return [];
  }
}

function getReadState(): Set<string> {
  if (typeof document === 'undefined') return new Set();
  try {
    const match = document.cookie.match(/dito-notif-read=([^;]*)/);
    if (match) return new Set(JSON.parse(decodeURIComponent(match[1])));
  } catch { /* ignore */ }
  return new Set();
}

function saveReadState(ids: Set<string>) {
  if (typeof document === 'undefined') return;
  document.cookie = `dito-notif-read=${encodeURIComponent(JSON.stringify([...ids]))}; path=/; max-age=${30*24*60*60}; SameSite=Strict`;
}

export function NotificationBell() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wallet = getWallet();
    const read = getReadState();
    setReadIds(read);

    if (wallet) {
      // Try Supabase first, fall back to local generation
      fetchSupabaseNotifications(wallet).then((sn) => {
        if (sn.length > 0) {
          setNotifications(sn);
        } else {
          const generated = generateNotifications();
          setNotifications(generated.map(n => ({ ...n, read: read.has(n.id) })));
        }
      });
    } else {
      const generated = generateNotifications();
      setNotifications(generated.map(n => ({ ...n, read: read.has(n.id) })));
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    const allIds = new Set(readIds);
    notifications.forEach(n => allIds.add(n.id));
    setReadIds(allIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    saveReadState(allIds);

    // Also mark read in Supabase
    const wallet = getWallet();
    if (wallet) {
      const ids = notifications.filter(n => !n.read).map(n => n.id);
      if (ids.length > 0) {
        const signMessageFn = getSignMessage();
        if (signMessageFn) {
          getAuthParams(wallet, signMessageFn).then(auth => {
            fetch('/api/notifications', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallet_address: wallet, notification_ids: ids, ...auth }),
            });
          }).catch(() => {});
        }
      }
    }
  }, [notifications, readIds]);

  const getStreakCount = () => {
    // Streak is calculated server-side; return 0 as fallback
    return 0;
  };

  const getText = (n: Notification) => {
    switch (n.type) {
      case 'streakReminder': return t(lang, 'notif.streakReminder');
      case 'streakCelebration': return t(lang, 'notif.streakCelebration').replace('{{count}}', String(getStreakCount()));
      case 'soulMintReady': return t(lang, 'notif.soulMintReady');
      case 'decayWarning': return t(lang, 'notif.decayWarning');
    }
  };

  const getIcon = (type: Notification['type']): React.ReactNode => {
    switch (type) {
      case 'streakReminder': return '📝';
      case 'streakCelebration': return <span className="inline-block">🔥</span>;
      case 'soulMintReady': return '✨';
      case 'decayWarning': return '💨';
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-base px-1 py-1 rounded-lg transition-colors relative"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#ff6b35] text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[300px] max-w-[calc(100vw-32px)] bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-sm font-semibold">{t(lang, 'notif.title')}</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#ff6b35] hover:underline"
              >
                {t(lang, 'notif.markAllRead')}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t(lang, 'notif.empty')}
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex items-start gap-3 border-b border-border last:border-b-0 transition-colors ${
                    n.read ? 'opacity-60' : 'bg-[#ff6b35]/5'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{getIcon(n.type)}</span>
                  <span className="text-sm leading-snug">{getText(n)}</span>
                  {!n.read && (
                    <span className="ml-auto flex-shrink-0 w-2 h-2 rounded-full bg-[#ff6b35] mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
