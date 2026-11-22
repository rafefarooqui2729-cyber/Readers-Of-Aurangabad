import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell, CheckCheck, X, Calendar, Megaphone, AlertCircle, Clock } from 'lucide-react';
import { useModalEscapeDismiss } from '../utils/modalAccessibility';
import { isSafeActionUrl, isSafeExternalUrl } from '../utils/url';
import type { MemberNotification } from '../types';

interface MemberNotificationCenterProps {
  isMember: boolean;
  isAuthenticated: boolean;
  notifications: MemberNotification[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => Promise<void> | void;
  onMarkAllRead: () => Promise<void> | void;
  onNavigate: (url: string) => void;
  onNavigateToAnnouncement: (announcementId: string) => void;
  onOpenSignIn: () => void;
}

const typeMeta = (type: MemberNotification['type']) => {
  switch (type) {
    case 'meetup_published':
      return { label: 'Meetup', icon: Calendar };
    case 'meetup_schedule_updated':
    case 'meetup_venue_updated':
      return { label: 'Meetup update', icon: Calendar };
    case 'meetup_cancelled':
      return { label: 'Cancelled', icon: AlertCircle };
    case 'community_update_published':
      return { label: 'Important update', icon: Megaphone };
    case 'announcement_published':
    default:
      return { label: 'Announcement', icon: Megaphone };
  }
};

export const MemberNotificationCenter: React.FC<MemberNotificationCenterProps> = ({
  isMember,
  isAuthenticated,
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  onNavigateToAnnouncement,
  onOpenSignIn,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const dismiss = useModalEscapeDismiss(
    open && isAuthenticated,
    () => setOpen(false),
    popoverRef,
    { trapFocus: false, initialFocus: false }
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        // An outside pointer interaction owns focus; do not pull it back to the bell.
        dismiss(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, dismiss]);

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications]
  );

  const handleClick = async (n: MemberNotification) => {
    if (!n.readAt) await onMarkRead(n.id);
    dismiss(false);
    if (n.announcementId) {
      onNavigateToAnnouncement(n.announcementId);
      return;
    }
    if (n.actionUrl) {
      const target = n.actionUrl.trim();
      if (isSafeExternalUrl(target)) {
        window.open(target, '_blank', 'noopener,noreferrer');
      } else if (isSafeActionUrl(target)) {
        onNavigate(target);
      }
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            onOpenSignIn();
            return;
          }
          setOpen(v => !v);
        }}
        className="rr-touch relative flex h-11 w-11 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-ink)] transition-colors hover:border-[color:var(--rr-brass)] cursor-pointer"
        aria-label={isAuthenticated ? 'Open notifications' : 'Sign in for notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {isAuthenticated && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center border border-[color:var(--rr-paper)] bg-[color:var(--rr-terracotta)] px-1 text-[10px] font-bold text-[color:var(--rr-on-dark)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && isAuthenticated && (
          <motion.div
            ref={popoverRef}
            tabIndex={-1}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="rr-modal absolute right-0 z-50 mt-3 w-[min(92vw,380px)] overflow-hidden"
            role="dialog"
            aria-label="Member notifications"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--rr-border)] bg-[color:var(--rr-paper)] px-4 py-3">
              <div>
                <h3 className="rr-title rr-title--small text-[color:var(--rr-ink)]">Notifications</h3>
                <p className="rr-meta mt-1 text-[color:var(--rr-muted)]">
                  {isMember ? 'Community updates for your member account' : 'Signed in'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void onMarkAllRead()}
                    className="p3-text-action rr-link cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismiss()}
                  className="p3-icon-button rr-touch flex h-9 w-9 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-muted)] hover:text-[color:var(--rr-ink)] cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p3-popover-body max-h-[70vh] overflow-y-auto bg-[color:var(--rr-ivory)] p-2.5">
              {loading ? (
                <div className="px-4 py-10 text-center rr-body">Loading notifications…</div>
              ) : sorted.length === 0 ? (
                <div className="rr-empty">
                  <Bell className="mx-auto mb-3 h-8 w-8 text-[color:var(--rr-muted)]" aria-hidden="true" />
                  <p className="font-semibold text-[color:var(--rr-ink)]">No notifications yet</p>
                  <p className="rr-body mt-1 max-w-xs text-xs">When new meetups or announcements are published, they&apos;ll appear here.</p>
                </div>
              ) : (
                <ul className="border-t border-[color:var(--rr-border)]">
                  {sorted.map((n) => {
                    const meta = typeMeta(n.type);
                    const Icon = meta.icon;
                    const unread = !n.readAt;
                    return (
                      <li key={n.id} className="border-b border-[color:var(--rr-border)]">
                        <button
                          type="button"
                          onClick={() => void handleClick(n)}
                          className={`p3-notification-item w-full cursor-pointer border-l-2 px-3.5 py-3 text-left transition-colors ${
                            unread
                              ? 'border-l-[color:var(--rr-terracotta)] bg-[color:var(--rr-paper)]'
                              : 'border-l-transparent bg-transparent hover:bg-[color:var(--rr-paper)]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border ${unread ? 'border-[color:var(--rr-border)] bg-[color:var(--rr-sage)] text-[color:var(--rr-forest)]' : 'border-[color:var(--rr-border)] text-[color:var(--rr-muted)]'}`}>
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="rr-meta text-[color:var(--rr-muted)]">{meta.label}</span>
                                {unread && <span className="h-1.5 w-1.5 bg-[color:var(--rr-terracotta)]" aria-label="Unread" />}
                              </div>
                              <p className="text-sm font-semibold leading-snug text-[color:var(--rr-ink)]">{n.title}</p>
                              <p className="rr-body mt-1 text-xs leading-relaxed">{n.message}</p>
                              <div className="mt-2 flex items-center gap-1.5 text-[color:var(--rr-muted)]">
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                <time dateTime={n.createdAt} className="rr-meta text-[10px]">
                                  {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </time>
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
