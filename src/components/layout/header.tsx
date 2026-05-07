'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LogIn, User, LogOut, ChevronDown, Check, Sun, Moon, Heart, Bell, MessageCircle, ThumbsUp, ListChecks, Megaphone, ExternalLink } from 'lucide-react';

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { getAuthSession, setAuthSession } from '@/hooks/use-local-storage';
import { ChampTeamsLogo } from './logo';
import { useFormat, FORMATS } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useNotifications, type NotificationItem } from '@/hooks/use-notifications';

const NOTIF_ICONS: Record<NotificationItem['type'], typeof Bell> = {
  comment: MessageCircle,
  reply: MessageCircle,
  like: ThumbsUp,
  'tier-list': ListChecks,
  announcement: Megaphone,
  'follow-cta': ExternalLink,
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const NAV_LINKS = [
  { href: '/builder', label: 'Builder' },
  { href: '/browse', label: 'Browse' },
  { href: '/teams', label: 'My Teams' },
];

export function Header() {
  const [session, setSession] = useState<{ userId: string; username: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { format, setFormatId } = useFormat();
  const { theme, toggleTheme } = useTheme();
  const { items: notifs, unread, markAllRead, markRead } = useNotifications();

  useEffect(() => {
    setSession(getAuthSession());
  }, []);

  // Handle Google OAuth callback session
  useEffect(() => {
    const authSession = searchParams.get('auth_session');
    if (authSession) {
      try {
        const parsed = JSON.parse(decodeURIComponent(authSession));
        if (parsed.userId && parsed.username) {
          setAuthSession(parsed);
          // Hard navigate to clean URL — ensures all components read fresh session
          const url = new URL(window.location.href);
          url.searchParams.delete('auth_session');
          url.searchParams.delete('auth_error');
          window.location.href = url.pathname + url.search;
          return;
        }
      } catch { /* ignore */ }
    }
  }, [searchParams]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const handleLogout = () => {
    setAuthSession(null);
    setSession(null);
    setProfileOpen(false);
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 shrink-0 text-white"
        style={{
          background:
            'linear-gradient(180deg, #1a1a2e 0%, #15152a 100%)',
          borderBottom: '1px solid rgba(212,160,23,0.22)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top hairline — gold → red → transparent bleed */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #d4a017 0%, #c0392b 35%, transparent 100%)',
          }}
        />
        <div className="flex h-14 items-center px-4 relative">
          {/* Left: logo + format badge (desktop only) */}
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <Link href="/landing" className="shrink-0 inline-flex items-center leading-none">
              <ChampTeamsLogo size="sm" />
            </Link>
            {/* Desktop-only format badge — chevron tab */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setFormatOpen(o => !o)}
                className="group inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-[#d4a017] uppercase hover:text-white transition-colors"
                style={{
                  fontFamily: '"Saira Condensed", var(--font-saira-condensed), sans-serif',
                  background: 'rgba(212,160,23,0.08)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  padding: '0.28rem 0.7rem 0.28rem 0.85rem',
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                }}
              >
                {format.shortName}
                <ChevronDown className="h-3 w-3" />
              </button>
              {formatOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFormatOpen(false)} />
                  <div
                    className="absolute top-full left-0 mt-2 z-50 min-w-[180px] py-1"
                    style={{
                      background: '#0f0f1a',
                      border: '1px solid rgba(212,160,23,0.3)',
                      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8)',
                    }}
                  >
                    <div className="px-3 pt-2 pb-1 text-[9px] font-bold tracking-[0.22em] text-[#d4a017]/60 uppercase"
                      style={{ fontFamily: '"Saira Condensed", sans-serif' }}
                    >
                      // FORMAT
                    </div>
                    {FORMATS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { setFormatId(f.id); setFormatOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          f.id === format.id
                            ? 'text-[#d4a017] bg-[#d4a017]/10 border-l-2 border-[#d4a017]'
                            : 'text-white/75 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Center: nav links — uppercase condensed with chevron active state */}
          <nav className="flex shrink-0 items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'relative px-3.5 py-2 text-[13px] uppercase transition-colors whitespace-nowrap',
                    active
                      ? 'text-[#d4a017]'
                      : 'text-white/65 hover:text-white',
                  ].join(' ')}
                  style={{
                    fontFamily: '"Saira Condensed", var(--font-saira-condensed), sans-serif',
                    fontWeight: active ? 800 : 600,
                    letterSpacing: '0.12em',
                  }}
                >
                  {label}
                  {active && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: '0.9rem',
                        right: '0.9rem',
                        bottom: '0.25rem',
                        height: '2px',
                        background: '#d4a017',
                        boxShadow: '0 0 8px rgba(212,160,23,0.5)',
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: profile dropdown (all screens) */}
          <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
            {session ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  className="relative flex items-center justify-center gap-1 sm:gap-1.5 h-8 rounded-md px-1.5 sm:px-2 text-xs transition-colors hover:bg-white/[0.06]"
                  aria-label={`Profile menu${unread > 0 ? ` (${unread} unread notifications)` : ''}`}
                >
                  <User className="h-4 w-4 text-[#d4a017] shrink-0" />
                  <span className="hidden sm:inline text-white/75 max-w-[120px] truncate">{session.username}</span>
                  <ChevronDown className="h-3 w-3 text-white/40 shrink-0" />
                  {unread > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                      style={{ background: '#c0392b' }}
                    >
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute top-full right-0 mt-1.5 z-50 bg-[#1a1a2e] border border-white/15 rounded-lg shadow-xl w-[min(320px,calc(100vw-1rem))] py-1 overflow-hidden flex flex-col max-h-[min(560px,calc(100vh-5rem))]">
                    {/* Username header + profile link */}
                    <div className="px-3 py-2 border-b border-white/10 shrink-0">
                      <div className="text-xs font-medium text-white">{session.username}</div>
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="text-[10px] text-[#d4a017] hover:underline mt-0.5 inline-block"
                      >
                        Manage Profile
                      </Link>
                    </div>

                    {/* Notifications section */}
                    <div className="border-b border-white/10 shrink-0">
                      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Bell className="h-3 w-3 text-white/40" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                            Notifications{unread > 0 ? ` · ${unread}` : ''}
                          </span>
                        </div>
                        {unread > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[10px] text-[#d4a017] hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto max-h-[220px]">
                        {notifs.length === 0 ? (
                          <div className="px-3 py-3 text-center text-[11px] text-white/40">
                            No notifications yet.
                          </div>
                        ) : (
                          notifs.slice(0, 8).map(n => {
                            const Icon = NOTIF_ICONS[n.type] || Bell;
                            const isUnread = !n.readAt;
                            const handleClick = () => {
                              if (isUnread) markRead(n.id);
                              setProfileOpen(false);
                            };
                            const inner = (
                              <div className={`flex gap-2 px-3 py-2 transition-colors ${isUnread ? 'bg-[#d4a017]/5' : 'hover:bg-white/[0.03]'}`}>
                                <div className={`shrink-0 mt-0.5 ${isUnread ? 'text-[#d4a017]' : 'text-white/40'}`}>
                                  <Icon className="h-3 w-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] text-white/85 leading-snug truncate">{n.title}</div>
                                  {n.body && <div className="text-[10px] text-white/50 mt-0.5 line-clamp-1">{n.body}</div>}
                                  <div className="text-[9px] text-white/30 mt-0.5">{relativeTime(n.createdAt)}</div>
                                </div>
                                {isUnread && <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-[#c0392b]" />}
                              </div>
                            );
                            return n.link ? (
                              <Link key={n.id} href={n.link} onClick={handleClick} className="block">
                                {inner}
                              </Link>
                            ) : (
                              <button key={n.id} onClick={handleClick} className="w-full text-left">
                                {inner}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {/* Format switcher */}
                      <div className="px-3 pt-2 pb-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">Format</div>
                      </div>
                      {FORMATS.map(f => (
                        <button
                          key={f.id}
                          onClick={() => { setFormatId(f.id); setProfileOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                            f.id === format.id
                              ? 'text-[#d4a017] bg-[#d4a017]/10'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span>{f.name}</span>
                          {f.id === format.id && <Check className="h-3 w-3" />}
                        </button>
                      ))}

                      {/* Theme toggle + Support + Follow */}
                      <div className="border-t border-white/10 mt-1 pt-1">
                        <button
                          onClick={toggleTheme}
                          className="w-full text-left px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                          {theme === 'dark'
                            ? <Sun className="h-3 w-3" />
                            : <Moon className="h-3 w-3" />}
                          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <a
                          href="https://ko-fi.com/champteamsgg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-left px-3 py-1.5 text-xs text-[#d4a017]/80 hover:text-[#d4a017] hover:bg-white/5 transition-colors flex items-center gap-2"
                        >
                          <Heart className="h-3 w-3" />
                          Support Us
                        </a>
                        <a
                          href="https://x.com/champteamsgg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-left px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                        >
                          <XLogo className="h-3 w-3" />
                          Follow Us on X
                        </a>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-white/10 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="h-3 w-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Theme toggle — visible when signed out (tapping flips light/dark) */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center h-7 w-7 rounded-md text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark'
                    ? <Sun className="h-4 w-4" />
                    : <Moon className="h-4 w-4" />}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 border border-white/15 bg-transparent text-xs text-white/72 hover:bg-white/10 hover:text-white"
                  onClick={() => setAuthOpen(true)}
                >
                  <LogIn className="mr-1 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} onSuccess={(s) => setSession(s)} />
    </>
  );
}
