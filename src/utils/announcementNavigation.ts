import type { Announcement } from '../types';

export const ANNOUNCEMENT_QUERY_PARAM = 'announcement';
export const announcementTargetDomId = (announcementId: string) => `community-announcement-${announcementId}`;

export const getAnnouncementNavigationId = (search: string): string | null => {
  const id = new URLSearchParams(search).get(ANNOUNCEMENT_QUERY_PARAM)?.trim();
  return id || null;
};

export const buildAnnouncementNavigationUrl = (currentUrl: string, announcementId: string): string => {
  const destination = new URL(currentUrl);
  destination.pathname = '/';
  destination.hash = '';
  destination.searchParams.set(ANNOUNCEMENT_QUERY_PARAM, announcementId);
  return `${destination.pathname}${destination.search}`;
};

export const findActiveAnnouncementById = (
  announcements: Announcement[],
  announcementId: string,
  now: number,
): Announcement | null => announcements.find(announcement =>
  announcement.id === announcementId
  && announcement.isPublished
  && (!announcement.expiresAt || new Date(announcement.expiresAt).getTime() >= now)
) || null;

export const scrollToAnnouncement = (announcementId: string, reduceMotion: boolean): boolean => {
  if (typeof document === 'undefined') return false;

  const target = document.getElementById(announcementTargetDomId(announcementId));
  if (!target) return false;

  target.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'center',
  });
  return true;
};
