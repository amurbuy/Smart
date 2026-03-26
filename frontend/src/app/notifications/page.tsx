'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  fetchNotifications, markNotificationRead,
  markAllNotificationsRead, fetchUnreadCount,
  triggerBirthCheck,
} from '@/api';
import type { Notification } from '@/types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function typeIcon(type: string) {
  if (type === 'BIRTH')              return '🐣';
  if (type === 'PREGNANCY_REMINDER') return '🤰';
  return '🔔';
}

function typeBadgeCls(type: string) {
  if (type === 'BIRTH')              return 'text-[#6dba7d] bg-[#6dba7d]/10 border-[#6dba7d]/30';
  if (type === 'PREGNANCY_REMINDER') return 'text-[#d4a84b] bg-[#d4a84b]/10 border-[#d4a84b]/30';
  return 'text-[#7a8c79] bg-[#1e2520] border-[#2a3029]';
}

export default function NotificationsPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread,        setUnread]        = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [triggering,    setTriggering]    = useState(false);
  const [triggerMsg,    setTriggerMsg]    = useState<string | null>(null);
  const [filter,        setFilter]        = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [n, u] = await Promise.all([fetchNotifications(), fetchUnreadCount()]);
      setNotifications(n);
      setUnread(u);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleRead = async (id: number) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      await triggerBirthCheck();
      setTriggerMsg('✓ Birth check complete — page will refresh');
      await loadData();
    } catch (e: any) {
      setTriggerMsg('⚠ ' + (e.message ?? 'Error'));
    } finally {
      setTriggering(false);
    }
  };

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#0f1210]">
      {/* Nav */}
      <header className="border-b border-[#2a3029] px-8 py-4 flex items-center justify-between sticky top-0 bg-[#0f1210]/90 backdrop-blur-sm z-40">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 text-[#7a8c79] hover:text-[#e8ead6] transition-colors">
            <span className="text-xl">🌿</span>
            <span className="font-display text-lg">SmartLivestock</span>
          </a>
          <nav className="flex items-center gap-1">
            <a href="/"              className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors">Dashboard</a>
            <a href="/groups"        className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors">Groups</a>
            <a href="/notifications" className="relative px-3 py-1.5 rounded-lg text-sm text-[#e8ead6] bg-[#1e2520] border border-[#2a3029] flex items-center gap-1.5">
              🔔 Messages
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-[#d97777] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </a>
            <a href="/ai"            className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors flex items-center gap-1.5">
              <span className="text-xs">✨</span> AI
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#7a8c79] font-mono">{user.fullName}</span>
          <button onClick={logout} className="text-xs text-[#7a8c79] hover:text-rose-400 border border-[#2a3029] px-3 py-1.5 rounded-lg transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl text-[#e8ead6]">Messages</h1>
            <p className="text-sm text-[#7a8c79] mt-1">
              {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {unread > 0 && (
              <button onClick={handleReadAll}
                className="text-xs font-mono text-[#6dba7d] border border-[#6dba7d]/30 px-3 py-1.5 rounded-lg hover:bg-[#6dba7d]/10 transition-colors">
                ✓ Mark all read
              </button>
            )}
            <button onClick={handleTrigger} disabled={triggering}
              className="text-xs font-mono text-[#d4a84b] border border-[#d4a84b]/30 px-3 py-1.5 rounded-lg hover:bg-[#d4a84b]/10 transition-colors disabled:opacity-50">
              {triggering ? '⏳ Checking…' : '🔄 Check births now'}
            </button>
          </div>
        </div>

        {triggerMsg && (
          <div className="rounded-xl border border-[#2a3029] bg-[#1e2520] px-5 py-3 text-sm font-mono text-[#6dba7d]">
            {triggerMsg}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 bg-[#161a17] border border-[#2a3029] rounded-xl p-1 w-fit">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-colors capitalize
                ${filter === f ? 'bg-[#2a3029] text-[#e8ead6]' : 'text-[#7a8c79] hover:text-[#e8ead6]'}`}>
              {f}{f === 'unread' && unread > 0 ? ` (${unread})` : ''}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#161a17] border border-[#2a3029] rounded-xl p-5 animate-pulse h-20" />
            ))
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-5xl opacity-30">🔔</span>
              <p className="text-[#7a8c79] font-mono text-sm">
                {filter === 'unread' ? 'No unread messages' : 'No notifications yet'}
              </p>
              <p className="text-xs text-[#3a4239] font-mono">
                Use "Check births now" to trigger the birth scheduler manually
              </p>
            </div>
          ) : (
            displayed.map(notif => (
              <div key={notif.id}
                onClick={() => !notif.isRead && handleRead(notif.id)}
                className={`flex items-start gap-4 rounded-xl border p-5 transition-all
                  ${notif.isRead
                    ? 'bg-[#161a17] border-[#2a3029] cursor-default'
                    : 'bg-[#161a17] border-[#3a4239] cursor-pointer hover:border-[#4a5248]'}`}>

                <div className="text-2xl shrink-0 mt-0.5">{typeIcon(notif.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs font-mono border px-2 py-0.5 rounded ${typeBadgeCls(notif.type)}`}>
                      {notif.type.replace('_', ' ')}
                    </span>
                    {notif.tagNumber && (
                      <span className="text-xs font-mono text-[#6dba7d]">{notif.tagNumber}</span>
                    )}
                    <span className="text-xs text-[#7a8c79] font-mono ml-auto shrink-0">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-[#7a8c79]' : 'text-[#e8ead6]'}`}>
                    {notif.message}
                  </p>
                  {notif.type === 'BIRTH' && notif.livestockId && (
                    <a href={`/?confirm=${notif.livestockId}`}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-mono text-[#6dba7d] hover:underline"
                      onClick={e => { e.stopPropagation(); if (!notif.isRead) handleRead(notif.id); }}>
                      → Confirm offspring on dashboard
                    </a>
                  )}
                  {!notif.isRead && (
                    <p className="text-xs text-[#3a4239] font-mono mt-1">Click to mark as read</p>
                  )}
                </div>

                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-[#6dba7d] shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
