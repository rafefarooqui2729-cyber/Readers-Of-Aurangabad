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
        className="relative glass-button-secondary w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
        aria-label={isAuthenticated ? 'Open notifications' : 'Sign in for notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5 text-[color:var(--text-muted)] dark:text-[#C7EFDE]" />
        {isAuthenticated && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F47B49] text-white text-[10px] font-bold flex items-center justify-center border border-white">
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
            className="p3-popover-surface absolute right-0 mt-3 w-[min(92vw,380px)] rounded-2xl glass-modal border border-white/70 shadow-2xl overflow-hidden z-50"
            role="dialog"
            aria-label="Member notifications"
          >
            <div className="p3-popover-header flex items-center justify-between px-4 py-3 border-b border-[#D4CFC5]/80 bg-white/70">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#24262D]">Notifications</h3>
                <p className="text-[11px] text-[#5E5B55]">
                  {isMember ? 'Community updates for your member account' : 'Signed in'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void onMarkAllRead()}
                    className="p3-text-action px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#24262D] hover:bg-[#F7F3EB] flex items-center gap-1.5 cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismiss()}
                  className="p3-icon-button w-8 h-8 rounded-lg hover:bg-[#F7F3EB] flex items-center justify-center cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4 text-[#5E5B55]" />
                </button>
              </div>
            </div>

            <div className="p3-popover-body max-h-[70vh] overflow-y-auto p-2.5 bg-[#F7F3EB]/70">
              {loading ? (
                <div className="px-4 py-10 text-center text-sm text-[#5E5B55]">Loading notifications…</div>
              ) : sorted.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-8 h-8 text-[#D4CFC5] mx-auto mb-2" />
                  <p className="font-medium text-[#24262D]">No notifications yet</p>
                  <p className="text-xs text-[#5E5B55] mt-1">When new meetups or announcements are published, they&apos;ll appear here.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {sorted.map((n) => {
                    const meta = typeMeta(n.type);
                    const Icon = meta.icon;
                    const unread = !n.readAt;
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => void handleClick(n)}
                          className={`p3-notification-item w-full text-left rounded-xl border px-3.5 py-3 transition-colors cursor-pointer ${
                            unread
                              ? 'bg-white border-[#D4CFC5] shadow-sm'
                              : 'bg-white/60 border-transparent hover:border-[#D4CFC5]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${unread ? 'bg-[#C7EFDE] text-[#24262D]' : 'bg-[#F7F3EB] text-[#5E5B55]'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#5E5B55]">{meta.label}</span>
                                {unread && <span className="w-2 h-2 rounded-full bg-[#F47B49]" aria-label="Unread" />}
                              </div>
                              <p className="font-semibold text-sm text-[#24262D] leading-snug">{n.title}</p>
                              <p className="text-xs text-[#5E5B55] mt-1 leading-relaxed">{n.message}</p>
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#5E5B55]">
                                <Clock className="w-3 h-3" />
                                <time dateTime={n.createdAt}>
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
