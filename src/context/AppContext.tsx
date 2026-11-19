import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  Language,
  PageRoute,
  Meetup,
  JournalArticle,
  ReaderStory,
  GalleryItem,
  Enquiry,
  EnquiryType,
  InstagramMediaItem,
  InstagramAuthConfig,
  ExtractedFrame,
  MeetupReel,
  Registration,
  Announcement,
  StaffProfile,
  MemberNotification
} from '../types';
import { translations } from '../i18n/translations';
import type { Translations } from '../i18n/translations';
import {
  initialMeetups,
  initialArticles,
  initialGallery,
  initialReels
} from '../data/initialData';
import {
  INITIAL_INSTAGRAM_CONFIG,
  SAMPLE_INSTAGRAM_POSTS
} from '../services/instagramService';
import { saveVideoBlob, getVideoObjectUrl, deleteVideoBlob } from '../utils/videoStorage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { validateGalleryImageFile, prepareGalleryImage } from '../utils/galleryImageUtils';
import {
  uploadGalleryImages,
  deleteUploadedGalleryStorageObjects,
  getSignedGalleryUrl,
  isStoragePath
} from '../utils/galleryStorage';
import {
  resolveReelMediaUrls,
  executeCreateReel,
  clearReelUrlCache,
} from '../utils/reelStorage';
import {
  evaluateAuthStateChange,
  canApplySensitiveRefresh,
  buildBackupExport,
  AuthCoordinator,
  type AuthCoordinatorCallbacks,
} from '../utils/authSecurity';
import { scrollToTop } from '../utils/scroll';
import { detectRecoveryIntent, isValidRecoveryEmail, MIN_PASSWORD_LENGTH } from '../utils/authRecovery';
import {
  buildAnnouncementNavigationUrl,
  getAnnouncementNavigationId,
} from '../utils/announcementNavigation';
import { isMeetupUpcoming, normalizeMeetup, parseMeetupDate } from '../utils/meetupStatus';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
  currentPage: PageRoute;
  setCurrentPage: (page: PageRoute) => void;
  announcementNavigationId: string | null;
  navigateToAnnouncement: (announcementId: string) => void;
  clearAnnouncementNavigation: (announcementId: string) => void;
  isPageLoading: boolean;
  navError: { page: PageRoute; error: unknown } | null;
  retryNavigation: () => void;
  selectedArticle: JournalArticle | null;
  setSelectedArticle: (article: JournalArticle | null) => void;
  selectedMeetup: Meetup | null;
  setSelectedMeetup: (meetup: Meetup | null) => void;

  // Data entities
  meetups: Meetup[];
  articles: JournalArticle[];
  stories: ReaderStory[];
  gallery: GalleryItem[];
  enquiries: Enquiry[];
  reels: MeetupReel[];
  registrations: Registration[];
  announcements: Announcement[];
  staffProfiles: StaffProfile[];

  // Connection status
  isDbConnected: boolean;
  dbLoading: boolean;
  refreshData: () => Promise<void>;

  // Reel Management
  addReel: (reelData: Omit<MeetupReel, 'id' | 'createdAt'>, videoFile?: File | Blob) => Promise<string>;
  updateReel: (id: string, updates: Partial<MeetupReel>) => Promise<void>;
  deleteReel: (id: string) => Promise<void>;
  reorderReels: (newOrderReels: MeetupReel[]) => Promise<void>;
  togglePublishReel: (id: string) => Promise<void>;

  // Instagram Media Library
  instagramConfig: InstagramAuthConfig;
  updateInstagramConfig: (cfg: Partial<InstagramAuthConfig>) => void;
  disconnectInstagram: () => void;
  instagramMedia: InstagramMediaItem[];
  importInstagramMedia: (items: InstagramMediaItem[]) => { added: number; skippedDuplicates: number };
  deleteInstagramMedia: (id: string) => void;
  updateInstagramMedia: (id: string, updates: Partial<InstagramMediaItem>) => void;
  togglePublishInstagramMedia: (id: string) => void;
  addExtractedFramesToMediaLibrary: (frames: ExtractedFrame[], sourceVideo: InstagramMediaItem) => void;
  assignMediaToTarget: (mediaUrl: string, target: 'meetup' | 'journal' | 'hero' | 'gallery', targetId?: string) => void;

  // Admin Auth
  isAdmin: boolean;
  adminAuthLoading: boolean;
  adminRole: 'admin' | 'editor' | null;
  currentUserEmail: string | null;
  currentUserDesignation: string | null;
  loginAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutAdmin: () => Promise<{ ok: boolean; error?: string }>;
  resetAdminPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  isPasswordRecovery: boolean;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  completePasswordRecovery: () => Promise<void>;

  // Member Auth & Notifications
  currentUserId: string | null;
  isMember: boolean;
  memberNotifications: MemberNotification[];
  unreadNotificationCount: number;
  notificationsLoading: boolean;
  loginMember: (email: string, password: string) => Promise<{ ok: boolean; error?: string; needsVerification?: boolean }>;
  requestMemberMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  logoutMember: () => Promise<{ ok: boolean; error?: string }>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // CRUD Actions
  addMeetup: (meetup: Omit<Meetup, 'id'>) => Promise<void>;
  updateMeetup: (id: string, meetup: Partial<Meetup>) => Promise<void>;
  deleteMeetup: (id: string) => Promise<void>;

  addArticle: (article: Omit<JournalArticle, 'id'>) => Promise<void>;
  updateArticle: (id: string, article: Partial<JournalArticle>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;

  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => Promise<void>;
  uploadGalleryItem: (
    file: File,
    title: string,
    caption?: string
  ) => Promise<{ ok: boolean; error?: string; item?: GalleryItem }>;
  deleteGalleryItem: (id: string) => Promise<void>;
  getSignedGalleryUrl: (
    path: string | null | undefined,
    type?: 'original' | 'thumbnail',
    expiresIn?: number
  ) => Promise<string>;

  addAnnouncement: (item: Omit<Announcement, 'id' | 'createdAt'>) => Promise<{ ok: boolean; error?: string }>;
  updateAnnouncement: (id: string, item: Partial<Announcement>) => Promise<{ ok: boolean; error?: string }>;
  deleteAnnouncement: (id: string) => Promise<{ ok: boolean; error?: string }>;

  addRegistration: (reg: Omit<Registration, 'id' | 'createdAt' | 'status'>) => Promise<{ ok: boolean; error?: string }>;
  updateRegistrationStatus: (id: string, status: Registration['status']) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;

  addStory: (story: Omit<ReaderStory, 'id'>) => void;
  deleteStory: (id: string) => void;

  addEnquiry: (enquiry: Omit<Enquiry, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateEnquiryStatus: (id: string, status: Enquiry['status']) => Promise<void>;
  deleteEnquiry: (id: string) => Promise<void>;

  updateStaffProfile: (id: string, updates: { role?: 'admin' | 'editor' | null; designation?: string }) => Promise<{ ok: boolean; error?: string }>;

  resetToDefaults: () => void;
  exportDataJson: () => { ok: boolean; error?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const VALID_PAGES: PageRoute[] = [
  'home',
  'story',
  'gatherings',
  'journal',
  'community',
  'get-involved',
  'contact',
  'admin',
  '404'
];

const getInitialPage = (): PageRoute => {
  if (typeof window === 'undefined') return 'home';
  try {
    const rawHash = window.location.hash.replace(/^#[/]?/, '').toLowerCase();
    if (VALID_PAGES.includes(rawHash as PageRoute)) return rawHash as PageRoute;

    const rawPath = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').toLowerCase();
    if (VALID_PAGES.includes(rawPath as PageRoute)) return rawPath as PageRoute;

    // A non-empty hash or path that is not a recognised page route is invalid.
    // Unknown hashes are only treated as 404 when they are not accompanied by a
    // valid pathname route (e.g. /story#code-of-conduct is a valid in-page anchor).
    if (rawHash || rawPath) return '404';
  } catch {
    // Ignore and fallback to home
  }
  return 'home';
};

const sanitizeInstagramConfig = (value: unknown): InstagramAuthConfig => {
  const candidate = value && typeof value === 'object'
    ? value as Partial<InstagramAuthConfig>
    : {};
  const accountTypes: InstagramAuthConfig['accountType'][] = ['BUSINESS', 'CREATOR', 'PERSONAL'];
  return {
    connected: false,
    username: typeof candidate.username === 'string'
      ? candidate.username
      : INITIAL_INSTAGRAM_CONFIG.username,
    accountType: accountTypes.includes(candidate.accountType as InstagramAuthConfig['accountType'])
      ? candidate.accountType as InstagramAuthConfig['accountType']
      : INITIAL_INSTAGRAM_CONFIG.accountType,
    ...(typeof candidate.lastSyncedAt === 'string' ? { lastSyncedAt: candidate.lastSyncedAt } : {})
  };
};

const pageLoaders: Record<PageRoute, () => Promise<unknown>> = {
  home: () => import('../pages/HomePage'),
  story: () => import('../pages/OurStoryPage'),
  gatherings: () => import('../pages/GatheringsPage'),
  journal: () => import('../pages/JournalPage'),
  community: () => import('../pages/CommunityPage'),
  'get-involved': () => import('../pages/GetInvolvedPage'),
  contact: () => import('../pages/ContactPage'),
  admin: () => import('../pages/AdminDashboard'),
  '404': () => import('../pages/NotFoundPage'),
};


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({children }) => {
  const [initialPage] = useState<PageRoute>(getInitialPage);

  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('roa_lang') as Language) || 'en';
  });

  const initialPageLoadGenerationRef = React.useRef(0);
  const [currentPage, setCurrentPageState] = useState<PageRoute>(initialPage);
  const [announcementNavigationId, setAnnouncementNavigationId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : getAnnouncementNavigationId(window.location.search)
  );

  // Keep the initial HTML loader visible while initial page chunk loads.
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);

  const [navError, setNavError] = useState<{
    page: PageRoute;
    error: unknown;
  } | null>(null);

  const navSeqRef = React.useRef<number>(0);
  const currentPageRef = React.useRef<PageRoute>(currentPage);
  const isMountedRef = React.useRef(true);
  const navigationTimersRef = React.useRef<Set<number>>(new Set());
  const initialPageLoadRef = React.useRef<Promise<unknown> | null>(null);

  // Navigation lifecycle cleanup.
  React.useEffect(() => {
    const mountedRef = isMountedRef;
    const navigationSequenceRef = navSeqRef;
    const navigationTimers = navigationTimersRef.current;

    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      navigationSequenceRef.current++;

      navigationTimers.forEach((timer) => {
        window.clearTimeout(timer);
      });

      navigationTimers.clear();
    };
  }, []);

  React.useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Preload the initial lazy page chunk once.
  React.useEffect(() => {
    const loadGenerationRef = initialPageLoadGenerationRef;

    const loader = pageLoaders[initialPage];

    if (!loader) {
      return;
    }

    const loadGeneration = ++loadGenerationRef.current;
    const navId = navSeqRef.current;

    if (!initialPageLoadRef.current) {
      initialPageLoadRef.current = loader();
    }

    initialPageLoadRef.current
      .then(() => {
        if (
          loadGeneration === loadGenerationRef.current &&
          isMountedRef.current &&
          navSeqRef.current === navId
        ) {
          setIsPageLoading(false);
        }
      })
      .catch((err) => {
        if (
          loadGeneration !== loadGenerationRef.current ||
          !isMountedRef.current ||
          navSeqRef.current !== navId
        ) {
          return;
        }

        console.warn('Initial page load error:', err);
        setIsPageLoading(false);
      });

    return () => {
      loadGenerationRef.current++;
    };
  }, [initialPage]);
  
  const performNavigation = useCallback((targetPage: PageRoute, fromBrowserHistory = false) => {
    // — If the target is already displayed, cancel any pending navigation and dismiss loader —
    if (targetPage === currentPageRef.current) {
      // Invalidate any in-flight navigation so its promise resolution is discarded
      navSeqRef.current++;
      setIsPageLoading(false);
      setNavError(null);
      scrollToTop();
      return;
    }

    // Increment sequence: any older in-flight navigation is now stale
    const navId = ++navSeqRef.current;
    setIsPageLoading(true);
    setNavError(null);

    // Do NOT push history yet — only push once the navigation actually succeeds.
    // This prevents phantom history entries from superseded navigations.

    const loader = pageLoaders[targetPage];
    const pagePromise = loader ? loader() : Promise.resolve();
    const minDurationPromise = new Promise<void>(resolve => {
      let timer = 0;
      timer = window.setTimeout(() => {
        navigationTimersRef.current.delete(timer);
        resolve();
      }, 500);
      navigationTimersRef.current.add(timer);
    });

    Promise.all([pagePromise, minDurationPromise])
      .then(() => {
        // Discard resolution if a newer navigation was initiated in the meantime
        if (!isMountedRef.current || navSeqRef.current !== navId) return;

        // Push the history entry only now, for the winning navigation.
        // Use the root path (/) since the app has no configured base path.
        // This avoids producing wrong URLs like /story/#journal when the
        // user arrived via a pathname-based direct link such as /story.
        if (!fromBrowserHistory) {
          const targetUrl = targetPage === 'home' ? '/' : `/#${targetPage}`;
          try {
            window.history.pushState({ page: targetPage }, '', targetUrl);
          } catch {
            window.location.hash = targetPage === 'home' ? '' : `#${targetPage}`;
          }
        }

        currentPageRef.current = targetPage;
        setCurrentPageState(targetPage);
        window.scrollTo({ top: 0, behavior: 'instant' });
        let timer = 0;
        timer = window.setTimeout(() => {
          navigationTimersRef.current.delete(timer);
          if (isMountedRef.current && navSeqRef.current === navId) {
            setIsPageLoading(false);
          }
        }, 120);
        navigationTimersRef.current.add(timer);
      })
      .catch(err => {
        if (!isMountedRef.current || navSeqRef.current !== navId) return;
        console.warn('Navigation error:', err);
        // Surface the error so the UI can show a recovery option
        setNavError({ page: targetPage, error: err });
        setIsPageLoading(false);
      });
  }, []);

  const retryNavigation = useCallback(() => {
    if (navError) {
      const { page } = navError;
      setNavError(null);
      performNavigation(page, false);
    }
  }, [navError, performNavigation]);

  const setCurrentPage = useCallback((targetPage: PageRoute) => {
    if (targetPage !== 'home') {
      setAnnouncementNavigationId(null);
    }
    performNavigation(targetPage, false);
  }, [performNavigation]);

  const navigateToAnnouncement = useCallback((announcementId: string) => {
    const targetId = announcementId.trim();
    if (!targetId) return;

    const targetUrl = buildAnnouncementNavigationUrl(window.location.href, targetId);
    window.history.pushState({ page: 'home' }, '', targetUrl);
    setAnnouncementNavigationId(targetId);
    performNavigation('home', true);
  }, [performNavigation]);

  const clearAnnouncementNavigation = useCallback((announcementId: string) => {
    setAnnouncementNavigationId(currentId => currentId === announcementId ? null : currentId);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const page = getInitialPage();
      setAnnouncementNavigationId(getAnnouncementNavigationId(window.location.search));
      // Always run performNavigation — it handles same-page cancellation internally
      performNavigation(page, true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [performNavigation]);
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAuthLoading, setAdminAuthLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<'admin' | 'editor' | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserDesignation, setCurrentUserDesignation] = useState<string | null>(null);
  const [currentAuthUserId, setCurrentAuthUserId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberNotifications, setMemberNotifications] = useState<MemberNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationChannelRef = useRef<any>(null);

  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  // Dedicated sequence counter for stale data refresh protection
  const refreshSequenceRef = useRef<number>(0);
  const currentRoleRef = useRef<'admin' | 'editor' | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const authCoordinatorRef = useRef(new AuthCoordinator());

  // Password recovery intent is captured synchronously from the URL before
  // supabase-js consumes and clears the recovery fragment.
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => detectRecoveryIntent(
    typeof window !== 'undefined' ? window.location.hash : '',
    typeof window !== 'undefined' ? window.location.search : ''
  ));


  // LocalStorage-backed state with auto-migration
  const loadWithSanitization = <T,>(key: string, initial: T, isInvalid: (data: T) => boolean): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return initial;
      const parsed = JSON.parse(saved);
      if (isInvalid(parsed)) {
        localStorage.removeItem(key);
        return initial;
      }
      return parsed;
    } catch {
      return initial;
    }
  };

  const hasLegacyUrls = (items: any): boolean => {
    if (!Array.isArray(items)) return true;
    const str = JSON.stringify(items);
    return str.includes('unsplash.com') || str.includes('photo-15');
  };

  const [meetups, setMeetups] = useState<Meetup[]>(() => {
    const stored = loadWithSanitization('roa_meetups_v4', initialMeetups, hasLegacyUrls);
    return Array.isArray(stored) ? stored.map(normalizeMeetup) : initialMeetups.map(normalizeMeetup);
  });

  const [articles, setArticles] = useState<JournalArticle[]>(() => {
    return loadWithSanitization('roa_articles_v4', initialArticles, hasLegacyUrls);
  });

  // Public reader stories require documented consent. Start empty and never
  // render legacy locally stored narratives without confirmation.
  const [stories, setStories] = useState<ReaderStory[]>([]);

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    return loadWithSanitization('roa_gallery_v4', initialGallery, (items) => !Array.isArray(items) || items.length < 12 || hasLegacyUrls(items));
  });

  // Sensitive data entities: initial state is empty to prevent unauthenticated exposure.
  // Existing localStorage keys (roa_enquiries_v4, roa_registrations_v1, roa_staff_profiles_v1)
  // are preserved without silent deletion, and are only accessible by verified administrators.
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const [reels, setReels] = useState<MeetupReel[]>(() => {
    try {
      const saved = localStorage.getItem('roa_reels_v1');
      if (saved) {
        const parsed = JSON.parse(saved) as MeetupReel[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map(r => r.id));
          return [...parsed, ...initialReels.filter(r => !savedIds.has(r.id))];
        }
      }
    } catch (e) {
      console.warn('Error loading saved reels:', e);
    }
    return initialReels;
  });

  const [registrations, setRegistrations] = useState<Registration[]>([]);

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
  const saved = localStorage.getItem('roa_announcements_v1');
  return saved ? JSON.parse(saved) : [];
});

  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const resetNotificationsState = useCallback(() => {
    if (notificationChannelRef.current && isSupabaseConfigured) {
      supabase.removeChannel(notificationChannelRef.current).catch(() => {});
      notificationChannelRef.current = null;
    }
    setMemberNotifications([]);
    setNotificationsLoading(false);
  }, []);

  // Helper to fail closed and clear all administrative privileges and sensitive data
  const resetAuthState = useCallback(() => {
    currentRoleRef.current = null;
    currentUserIdRef.current = null;
    setIsAdmin(false);
    setAdminRole(null);
    setCurrentUserEmail(null);
    setCurrentUserDesignation(null);
    setCurrentAuthUserId(null);
    setIsMember(false);
    setRegistrations([]);
    setEnquiries([]);
    setStaffProfiles([]);
    resetNotificationsState();
    setAdminAuthLoading(false);
    clearReelUrlCache();
  }, [resetNotificationsState]);



  // Instagram integration state
  const [instagramConfig, setInstagramConfig] = useState<InstagramAuthConfig>(() => {
    const saved = localStorage.getItem('roa_ig_config');
    if (!saved) return INITIAL_INSTAGRAM_CONFIG;
    try {
      return sanitizeInstagramConfig(JSON.parse(saved));
    } catch {
      return INITIAL_INSTAGRAM_CONFIG;
    }
  });

  const [instagramMedia, setInstagramMedia] = useState<InstagramMediaItem[]>(() => {
    const saved = localStorage.getItem('roa_ig_media');
    if (!saved) return SAMPLE_INSTAGRAM_POSTS;
    try {
      const savedMedia = JSON.parse(saved) as InstagramMediaItem[];
      const savedIds = new Set(savedMedia.map(item => item.id));
      return [
        ...SAMPLE_INSTAGRAM_POSTS.filter(item => !savedIds.has(item.id)),
        ...savedMedia
      ];
    } catch {
      return SAMPLE_INSTAGRAM_POSTS;
    }
  });

  const initialReelsSnapshotRef = useRef(reels);

 // IndexedDB custom reel resolver on mount.
// Resolve only the initial local reels; do not rerun on setReels updates.
useEffect(() => {

  async function resolveCustomReels() {
    const initialReels = initialReelsSnapshotRef.current;

    const customReels = initialReels.filter(
      r => r.isCustomUpload && (!r.videoUrl || r.videoUrl.startsWith('blob:'))
    );

    if (customReels.length === 0) return;

    const updated = await Promise.all(
      initialReels.map(async (reel) => {
        if (reel.isCustomUpload) {
          const blobUrl = await getVideoObjectUrl(reel.id);

          if (blobUrl) {
            return { ...reel, videoUrl: blobUrl };
          }
        }

        return reel;
      })
    );

    if (isMountedRef.current) {
  setReels(updated);
}
  }

  void resolveCustomReels();
}, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('roa_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('roa_meetups_v4', JSON.stringify(meetups));
  }, [meetups]);

  useEffect(() => {
    localStorage.setItem('roa_articles_v4', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('roa_stories_v4', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('roa_gallery_v4', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem('roa_announcements_v1', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    const metadata = reels.map(r => r.isCustomUpload ? { ...r, videoUrl: '' } : r);
    localStorage.setItem('roa_reels_v1', JSON.stringify(metadata));
  }, [reels]);

  useEffect(() => {
    localStorage.setItem('roa_ig_config', JSON.stringify(sanitizeInstagramConfig(instagramConfig)));
  }, [instagramConfig]);

  useEffect(() => {
    localStorage.setItem('roa_ig_media', JSON.stringify(instagramMedia));
  }, [instagramMedia]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const isRTL = lang === 'ur';
  const t = translations[lang] || translations.en;

  // --- SUPABASE LIVE DATA FETCHING ---
  const refreshData = useCallback(async () => {
    const refreshSeq = ++refreshSequenceRef.current;
    const initiatingUserId = currentUserIdRef.current;

    if (!isSupabaseConfigured) {
      setDbLoading(false);
      setIsDbConnected(false);
      setRegistrations([]);
      setEnquiries([]);
      setStaffProfiles([]);
      return;
    }

    setDbLoading(true);
    let anySuccess = false;

    try {
      // 1. Fetch meetups
      const { data: dbMeetups, error: meetupsErr } = await supabase
        .from('meetups')
        .select('*')
        .order('starts_at', { ascending: false });

      if (refreshSeq === refreshSequenceRef.current && !meetupsErr && dbMeetups && dbMeetups.length > 0) {
        anySuccess = true;
        const mapped: Meetup[] = dbMeetups.map(m => {
          const meetup: Meetup = {
            id: m.id,
            title: m.title,
            edition: m.edition || undefined,
            date: new Date(m.starts_at).toLocaleDateString('en-IN', {
              timeZone: 'Asia/Kolkata',
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            time: m.time_label || '8:30 AM – 11:00 AM IST',
            startsAt: m.starts_at,
            venue: m.venue,
            address: m.address || undefined,
            description: m.description,
            featuredImage: m.featured_image || '/images/enhanced/community/meetup-card-1.webp',
            registrationUrl: m.registration_url || '',
            rsvpLink: m.registration_url || undefined,
            registrationStatus: m.registration_status,
            capacity: m.capacity ? String(m.capacity) : undefined,
            activities: Array.isArray(m.activities) ? (m.activities as string[]) : ['Silent Reading', 'Book Swap'],
            schedule: Array.isArray(m.schedule) ? (m.schedule as { time: string; activity: string }[]) : undefined,
            highlights: m.highlights || undefined,
            isPublished: m.is_published,
            isCompleted: m.is_completed,
            isUpcoming: false,
          };
          return { ...meetup, isUpcoming: isMeetupUpcoming(meetup) };
        });
        setMeetups(mapped);
      }

      // 2. Fetch articles
      const { data: dbArticles, error: artErr } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (refreshSeq === refreshSequenceRef.current && !artErr && dbArticles && dbArticles.length > 0) {
        anySuccess = true;
        const mappedArticles: JournalArticle[] = dbArticles.map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          author: a.author,
          authorRole: a.author_role || undefined,
          category: a.category as JournalArticle['category'],
          publishedDate: a.published_at ? new Date(a.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date(a.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          readingTime: a.reading_time || '5',
          coverImage: a.cover_image || '/images/enhanced/gallery/roa-019-2026-11-05.webp',
          excerpt: a.excerpt,
          content: a.content,
          language: a.language as Language,
          tags: Array.isArray(a.tags) ? (a.tags as string[]) : [],
          featured: a.featured
        }));
        setArticles(mappedArticles);
      }

      // 3. Fetch gallery
      const { data: dbGallery, error: galErr } = await supabase
        .from('gallery_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (refreshSeq === refreshSequenceRef.current && !galErr && dbGallery && dbGallery.length > 0) {
        anySuccess = true;
        const mappedGal: GalleryItem[] = dbGallery.map(g => ({
          id: g.id,
          title: g.title,
          caption: g.caption || '',
          imageUrl: g.image_path,
          thumbnailUrl: g.thumbnail_path || undefined,
          meetupId: g.meetup_id || undefined,
          date: new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        }));
        setGallery(mappedGal);
      }

      // 4. Fetch reels
      const { data: dbReels, error: reelsErr } = await supabase
        .from('reels')
        .select('*')
        .order('display_order', { ascending: true });

      if (refreshSeq === refreshSequenceRef.current && !reelsErr && dbReels && dbReels.length > 0) {
        anySuccess = true;
        const mappedReels: MeetupReel[] = await Promise.all(
          dbReels.map(async r => {
            try {
              const { videoUrl, posterUrl } = await resolveReelMediaUrls(
                { video_path: r.video_path, poster_path: r.poster_path },
                supabase
              );

              return {
                id: r.id,
                title: r.title,
                caption: r.caption || undefined,
                videoUrl,
                posterUrl,
                order: r.display_order,
                published: r.is_published,
                isPublished: r.is_published,
                createdAt: r.created_at,
                durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : undefined,
                isCustomUpload: false
              };
            } catch (reelErr) {
              console.warn(`Error resolving media for reel ${r.id}:`, reelErr);
              return {
                id: r.id,
                title: r.title,
                caption: r.caption || undefined,
                videoUrl: '',
                posterUrl: undefined,
                order: r.display_order,
                published: r.is_published,
                isPublished: r.is_published,
                createdAt: r.created_at,
                durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : undefined,
                isCustomUpload: false
              };
            }
          })
        );
        if (refreshSeq === refreshSequenceRef.current) {
          setReels(mappedReels);
        }
      }

      // 5. Fetch announcements
      const { data: dbAnnouncements, error: annErr } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (refreshSeq === refreshSequenceRef.current && !annErr && dbAnnouncements) {
        anySuccess = true;
        setAnnouncements(dbAnnouncements.map(an => ({
          id: an.id,
          title: an.title,
          content: an.content,
          actionUrl: an.action_url || undefined,
          isPublished: an.is_published,
          publishedAt: an.published_at,
          expiresAt: an.expires_at || undefined,
          createdAt: an.created_at
        })));
      }

      // Revalidate active user's role for both admin and editor sessions
      const currentActiveUserId = currentUserIdRef.current;
      const activeRole = currentRoleRef.current;
      let activeUserVerifiedRole: 'admin' | 'editor' | null = activeRole;

      if (currentActiveUserId && activeRole) {
        try {
          const { data: myProfile, error: myProfileErr } = await supabase
            .from('profiles')
            .select('role, designation, full_name')
            .eq('id', currentActiveUserId)
            .maybeSingle();

          if (refreshSeq === refreshSequenceRef.current && currentUserIdRef.current === currentActiveUserId) {
            if (myProfileErr) {
              // Temporary network or query failure: fail closed in application UI for sensitive admin data,
              // but DO NOT destroy the valid Supabase Auth session.
              console.warn('Temporary profile revalidation error during refresh; failing closed for administrative data:', myProfileErr.message);
              currentRoleRef.current = null;
              currentUserIdRef.current = null;
              setIsAdmin(false);
              setAdminRole(null);
              setRegistrations([]);
              setEnquiries([]);
              setStaffProfiles([]);
              activeUserVerifiedRole = null;
              return;
            } else if (!myProfile || (myProfile.role !== 'admin' && myProfile.role !== 'editor')) {
              // Confirmed missing profile or role revoked: clear privileges and sign out via coordinator
              console.warn('Active user staff role revoked or profile deleted; resetting auth and signing out via coordinator');
              currentRoleRef.current = null;
              currentUserIdRef.current = null;
              setIsAdmin(false);
              setAdminRole(null);
              setRegistrations([]);
              setEnquiries([]);
              setStaffProfiles([]);
              activeUserVerifiedRole = null;
              await authCoordinatorRef.current.signOutForRevocation(currentActiveUserId, supabase, {
                onLoading: setAdminAuthLoading,
                onResetState: resetAuthState,
              });
              return;
            } else {
              const newRole = myProfile.role as 'admin' | 'editor';
              if (activeRole === 'admin' && newRole === 'editor') {
                // Role downgrade
                console.warn('Admin role downgraded to editor; clearing admin data and updating role');
                currentRoleRef.current = 'editor';
                setAdminRole('editor');
                setRegistrations([]);
                setEnquiries([]);
                setStaffProfiles([]);
                activeUserVerifiedRole = 'editor';
              } else if (activeRole === 'editor' && newRole === 'admin') {
                currentRoleRef.current = 'admin';
                setAdminRole('admin');
                activeUserVerifiedRole = 'admin';
              } else {
                activeUserVerifiedRole = newRole;
              }
            }
          }
        } catch (err) {
          console.warn('Exception during profile revalidation in refreshData; failing closed:', err);
          if (refreshSeq === refreshSequenceRef.current && currentUserIdRef.current === currentActiveUserId) {
            currentRoleRef.current = null;
            currentUserIdRef.current = null;
            setIsAdmin(false);
            setAdminRole(null);
            setRegistrations([]);
            setEnquiries([]);
            setStaffProfiles([]);
            activeUserVerifiedRole = null;
            return;
          }
        }
      }

      // Administrative queries: strictly verify active sequence, user identity, and admin role
      const isVerifiedAdmin = currentRoleRef.current === 'admin' && adminRole === 'admin' && activeUserVerifiedRole === 'admin';

      if (isVerifiedAdmin) {
        const canApply = () => canApplySensitiveRefresh({
          refreshSeq,
          currentRefreshSeq: refreshSequenceRef.current,
          currentRole: currentRoleRef.current,
          adminRole,
          initiatingUserId,
          currentUserId: currentUserIdRef.current,
        });

        // 6. Admin-only: Registrations
        try {
          const { data: dbRegs, error: regsErr } = await supabase
            .from('registrations')
            .select('*, meetups(title)')
            .order('created_at', { ascending: false });

          if (!canApply()) {
            // A stale request must not populate or clear another session's data
            return;
          }

          if (regsErr || !dbRegs) {
            console.warn('Failed to fetch registrations:', regsErr?.message);
            setRegistrations([]);
          } else {
            anySuccess = true;
            setRegistrations(dbRegs.map(r => ({
              id: r.id,
              meetupId: r.meetup_id,
              meetupTitle: (r as any).meetups?.title || undefined,
              name: r.name,
              email: r.email,
              phone: r.phone || undefined,
              message: r.message || undefined,
              consent: r.consent,
              status: r.status,
              details: r.details as Record<string, any>,
              createdAt: r.created_at
            })));
          }
        } catch (e) {
          console.warn('Error fetching registrations:', e);
          if (canApply()) {
            setRegistrations([]);
          }
        }

        // 7. Admin-only: Enquiries
        try {
          const { data: dbEnqs, error: enqsErr } = await supabase
            .from('enquiries')
            .select('*')
            .order('created_at', { ascending: false });

          if (!canApply()) {
            // A stale request must not populate or clear another session's data
            return;
          }

          if (enqsErr || !dbEnqs) {
            console.warn('Failed to fetch enquiries:', enqsErr?.message);
            setEnquiries([]);
          } else {
            anySuccess = true;
            setEnquiries(dbEnqs.map(e => ({
              id: e.id,
              type: e.type,
              name: e.name,
              email: e.email,
              phone: e.phone || undefined,
              message: e.message,
              consent: e.consent,
              details: e.details as Record<string, any>,
              createdAt: e.created_at,
              status: e.status
            })));
          }
        } catch (e) {
          console.warn('Error fetching enquiries:', e);
          if (canApply()) {
            setEnquiries([]);
          }
        }

        // 8. Admin-only: Profiles
        try {
          const { data: dbProfiles, error: profsErr } = await supabase
            .from('profiles')
            .select('*')
            .order('role', { ascending: true });

          if (!canApply()) {
            // A stale request must not populate or clear another session's data
            return;
          }

          if (profsErr || !dbProfiles) {
            console.warn('Failed to fetch staff profiles:', profsErr?.message);
            setStaffProfiles([]);
          } else {
            anySuccess = true;
            // Check if active initiating user's role has been downgraded or revoked
            const myProfile = dbProfiles.find(p => p.id === initiatingUserId);
            if (myProfile && myProfile.role !== 'admin') {
              console.warn('Admin role changed or revoked; adjusting frontend privileges');
              currentRoleRef.current = myProfile.role === 'editor' ? 'editor' : null;
              currentUserIdRef.current = myProfile.role === 'editor' ?initiatingUserId : null;
              setAdminRole(myProfile.role === 'editor' ? 'editor' : null);
              if (myProfile.role !== 'editor') {
                setIsAdmin(false);
              }
              setRegistrations([]);
              setEnquiries([]);
              setStaffProfiles([]);
              if (myProfile.role !== 'editor') {
                resetAuthState();
                if (initiatingUserId) {
                  await authCoordinatorRef.current.signOutForRevocation(initiatingUserId, supabase, {
                    onLoading: setAdminAuthLoading,
                    onResetState: resetAuthState,
                  });
                }
              }
              return;
            }

            setStaffProfiles(dbProfiles.map(p => ({
              id: p.id,
              email: p.email,
              fullName: p.full_name || undefined,
              role: p.role,
              designation: p.designation || undefined,
              createdAt: p.created_at,
              updatedAt: p.updated_at
            })));
          }
        } catch (e) {
          console.warn('Error fetching staff profiles:', e);
          if (canApply()) {
            setStaffProfiles([]);
          }
        }
      } else {
        // Enforce in-memory clearing of administrative data for non-admins / editors
        // Only if this request is still the current refresh sequence
        if (refreshSeq === refreshSequenceRef.current) {
          setRegistrations([]);
          setEnquiries([]);
          setStaffProfiles([]);
        }
      }

      if (refreshSeq === refreshSequenceRef.current) {
        setIsDbConnected(anySuccess);
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to local data:', e);
      // Clear sensitive arrays only if the failing request is still the current refresh
      // and its session ownership remains valid. A stale outer failure must not clear newer data.
      if (canApplySensitiveRefresh({
        refreshSeq,
        currentRefreshSeq: refreshSequenceRef.current,
        currentRole: currentRoleRef.current,
        adminRole,
        initiatingUserId,
        currentUserId: currentUserIdRef.current,
      })) {
        setRegistrations([]);
        setEnquiries([]);
        setStaffProfiles([]);
      }
      if (refreshSeq === refreshSequenceRef.current) {
        setIsDbConnected(false);
      }
    } finally {
      if (refreshSeq === refreshSequenceRef.current) {
        setDbLoading(false);
      }
    }
}, [adminRole, resetAuthState]);
 // Initial load
useEffect(() => {
  // oxlint-disable-next-line react/set-state-in-effect -- Initial mount intentionally starts the async data refresh and its loading-state updates.
  void refreshData();
}, [refreshData]);

  // Admin auth resolution
  useEffect(() => {
    const lifecycle = new AbortController();

   const coordinatorCallbacks: AuthCoordinatorCallbacks = {
  onLoading: (loading) => {
    if (!lifecycle.signal.aborted) {
      setAdminAuthLoading(loading);
    }
  },

  onResetState: () => {
    if (lifecycle.signal.aborted) return;

    currentRoleRef.current = null;
    currentUserIdRef.current = null;
    resetAuthState();
  },

  onAccountSwitch: (_prevUserId, _newUserId) => {
    if (lifecycle.signal.aborted) return;

    refreshSequenceRef.current++;
    currentRoleRef.current = null;
    currentUserIdRef.current = null;
    resetAuthState();
  },

  onAuthenticated: ({ userId, email, role, designation }) => {
    if (lifecycle.signal.aborted) return;

    currentRoleRef.current = role;
    currentUserIdRef.current = userId;

    if (role !== 'admin') {
      setRegistrations([]);
      setEnquiries([]);
      setStaffProfiles([]);
    }

    setAdminRole(role);
    setIsAdmin(true);
    setCurrentUserEmail(email);
    setCurrentUserDesignation(designation);
    setCurrentAuthUserId(userId);
    setIsMember(false);
    setAdminAuthLoading(false);
  },

  onMemberAuthenticated: ({ userId, email }) => {
    if (lifecycle.signal.aborted) return;

    currentRoleRef.current = null;
    currentUserIdRef.current = userId;
    setAdminRole(null);
    setIsAdmin(false);
    setCurrentUserDesignation(null);
    setRegistrations([]);
    setEnquiries([]);
    setStaffProfiles([]);
    setCurrentUserEmail(email);
    setCurrentAuthUserId(userId);
    setIsMember(true);
    setAdminAuthLoading(false);
  },

  onRoleDowngrade: () => {
    if (lifecycle.signal.aborted) return;

    setRegistrations([]);
    setEnquiries([]);
    setStaffProfiles([]);
  },

  onRefreshNeeded: () => {
    if (!lifecycle.signal.aborted) {
      void refreshData();
    }
  },
};

const resolveAdminSession = async (
  existingSession?: any,
  assignedSeq?: number
) => {
  if (lifecycle.signal.aborted) return;

  if (!isSupabaseConfigured) {
    resetAuthState();
    return;
  }

  await authCoordinatorRef.current.resolveSession(
    existingSession,
    assignedSeq,
    supabase,
    coordinatorCallbacks
  );
};

    // During a recovery redirect the user has a short-lived recovery session;
    // profile resolution must not run (or sign out) before they set a password.
    if (!isPasswordRecovery) {
      void resolveAdminSession();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (lifecycle.signal.aborted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        return;
      }

      const decision = evaluateAuthStateChange({
        event,
        hasUser: Boolean(session?.user),
        inFlightLogoutSeq: authCoordinatorRef.current.getInFlightLogoutSeq(),
        inFlightLoginSeq: authCoordinatorRef.current.getInFlightLoginSeq(),
        currentUserId: authCoordinatorRef.current.getCurrentUserId() ?? currentUserIdRef.current,
        eventUserId: session?.user?.id || null,
        isAlreadyVerified: (authCoordinatorRef.current.getCurrentRole() ?? currentRoleRef.current) !== null,
      });

      if (decision.action === 'IGNORE_IN_FLIGHT_LOGOUT') {
        return;
      }

      if (decision.action === 'RESET_STATE') {
        refreshSequenceRef.current++;
        authCoordinatorRef.current.resetInternalState();
        currentRoleRef.current = null;
        currentUserIdRef.current = null;
        resetAuthState();
        return;
      }

      if (decision.action === 'IGNORE_IN_FLIGHT_LOGIN') {
        return;
      }

      if (decision.action === 'UPDATE_EMAIL_ONLY') {
        setCurrentUserEmail(session?.user?.email || null);
        return;
      }

      // Defer profile resolution until after callback returns, preserving sequence and event ordering
      const resolutionSeq = authCoordinatorRef.current.nextSeq();
      queueMicrotask(() => {
        if (
  lifecycle.signal.aborted ||
  resolutionSeq !== authCoordinatorRef.current.getLatestSeq()
) return;
        void resolveAdminSession(session, resolutionSeq);
      });
    });

    return () => {
  lifecycle.abort();
  subscription.unsubscribe();
};
  }, [resetAuthState, refreshData, isPasswordRecovery]);

  const loginAdmin = async (emailInput: string, passwordInput: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured for this deployment.' };
    }

    return authCoordinatorRef.current.login(
      emailInput,
      passwordInput,
      supabase,
      {
        onLoading: setAdminAuthLoading,
        onResetState: () => {
          currentRoleRef.current = null;
          currentUserIdRef.current = null;
          resetAuthState();
        },
        onAccountSwitch: (_prevUserId, _newUserId) => {
          refreshSequenceRef.current++;
          currentRoleRef.current = null;
          currentUserIdRef.current = null;
          resetAuthState();
        },
        onAuthenticated: ({ userId, email, role, designation }) => {
          currentRoleRef.current = role;
          currentUserIdRef.current = userId;
          if (role !== 'admin') {
            setRegistrations([]);
            setEnquiries([]);
            setStaffProfiles([]);
          }
          setAdminRole(role);
          setIsAdmin(true);
          setCurrentUserEmail(email);
          setCurrentUserDesignation(designation);
          setCurrentAuthUserId(userId);
          setIsMember(false);
          setAdminAuthLoading(false);
        },
        onMemberAuthenticated: ({ userId, email }) => {
          currentRoleRef.current = null;
          currentUserIdRef.current = userId;
          setAdminRole(null);
          setIsAdmin(false);
          setCurrentUserDesignation(null);
          setRegistrations([]);
          setEnquiries([]);
          setStaffProfiles([]);
          setCurrentUserEmail(email);
          setCurrentAuthUserId(userId);
          setIsMember(true);
          setAdminAuthLoading(false);
        },
        onRoleDowngrade: () => {
          setRegistrations([]);
          setEnquiries([]);
          setStaffProfiles([]);
        },
        onRefreshNeeded: () => {
          void refreshData();
        },
      }
    );
  };

  const logoutAdmin = async (): Promise<{ ok: boolean; error?: string }> => {
    refreshSequenceRef.current++;
    const res = await authCoordinatorRef.current.logout(supabase, {
      onLoading: setAdminAuthLoading,
      onResetState: () => {
        currentRoleRef.current = null;
        currentUserIdRef.current = null;
        resetAuthState();
        if (currentPage === 'admin') {
          setCurrentPage('home');
        }
      },
    });
    return res;
  };

  /**
   * Requests a password-reset email. Always reports success for a well-formed
   * address so the response never discloses whether an account exists.
   */
  const requestPasswordReset = async (emailInput: string) => {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured for this deployment.' };
    }

    const email = emailInput.trim();
    if (!isValidRecoveryEmail(email)) {
      return { ok: false, error: 'Enter a valid email address.' };
    }

    // Redirect to the app root so supabase-js can parse the implicit recovery
    // fragment and emit PASSWORD_RECOVERY before the URL is cleaned.
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      // Log only the provider message; never the address or any token.
      console.warn('Password reset request did not complete:', error.message);
    }

    return { ok: true };
  };

  // Kept for existing staff-dashboard call sites; identical safe behaviour.
  const resetAdminPassword = requestPasswordReset;

  /**
   * Updates the password for the current recovery session. Requires a live
   * session; supabase-js verifies the recovery JWT server-side.
   */
  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured for this deployment.' };
    }
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { ok: false, error: 'This password reset link is invalid or has expired.' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  };

  /** Signs out the recovery session and returns the app to its normal state. */
  const completePasswordRecovery = async () => {
    refreshSequenceRef.current++;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Recovery sign-out did not complete:', err);
    }

    authCoordinatorRef.current.resetInternalState();
    currentRoleRef.current = null;
    currentUserIdRef.current = null;
    resetAuthState();
    setIsPasswordRecovery(false);

    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      window.location.hash = '';
    }
  };

  // --- CRUD METHODS (SUPABASE FIRST, FALLBACK LOCAL) ---

  // Date parsing and upcoming derivation live in utils/meetupStatus so seed,
  // localStorage and Supabase paths all fail closed with the same IST-aware logic.

  // Meetup CRUD
  const addMeetup = async (meetupData: Omit<Meetup, 'id'>) => {
    const slug = meetupData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const startsAt = meetupData.startsAt || parseMeetupDate(meetupData.date, meetupData.time);
    const localMeetup: Meetup = {
      ...meetupData,
      id: `meetup-${Date.now()}`,
      startsAt,
      isPublished: meetupData.isPublished ?? true,
      isCompleted: meetupData.isCompleted ?? false,
      isUpcoming: isMeetupUpcoming({ ...meetupData, startsAt }),
    };

    // Offline/demo mode: retain local-only functionality.
    if (!isSupabaseConfigured) {
      setMeetups(prev => [localMeetup, ...prev]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meetups')
        .insert({
          title: meetupData.title,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          edition: meetupData.edition || null,
          starts_at: startsAt,
          time_label: meetupData.time,
          venue: meetupData.venue,
          address: meetupData.address || null,
          description: meetupData.description,
          featured_image: meetupData.featuredImage || null,
          registration_url: meetupData.registrationUrl || null,
          registration_status: meetupData.registrationStatus,
          capacity: meetupData.capacity
            ? parseInt(String(meetupData.capacity), 10)
            : null,
          activities: meetupData.activities,
          schedule: meetupData.schedule || [],
          highlights: meetupData.highlights || null,
          is_published: meetupData.isPublished ?? true,
          is_completed: meetupData.isCompleted ?? false,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error('Meetup was not saved: no database ID returned.');

      setMeetups(prev => [{ ...localMeetup, id: data.id }, ...prev]);
    } catch (error) {
      console.error('Failed to create meetup:', error);
      throw error;
    }
  };

  const updateMeetup = async (id: string, updated: Partial<Meetup>) => {
    // Offline/demo mode.
    if (!isSupabaseConfigured) {
      setMeetups(prev =>
        prev.map(meetup => {
          if (meetup.id !== id) return meetup;
          const next = { ...meetup, ...updated };
          return { ...next, isUpcoming: isMeetupUpcoming(next) };
        })
      );
      return;
    }

    try {
      const dbUpdates: Record<string, unknown> = {};

      if (updated.title !== undefined) dbUpdates.title = updated.title;
      if (updated.edition !== undefined) dbUpdates.edition = updated.edition;
      if (updated.date !== undefined) {
        const existingTime = updated.time ?? meetups.find(m => m.id === id)?.time;
        dbUpdates.starts_at = parseMeetupDate(updated.date, existingTime);
      }
      if (updated.startsAt !== undefined) dbUpdates.starts_at = updated.startsAt;
      if (updated.time !== undefined) dbUpdates.time_label = updated.time;
      if (updated.venue !== undefined) dbUpdates.venue = updated.venue;
      if (updated.address !== undefined) dbUpdates.address = updated.address;
      if (updated.description !== undefined) dbUpdates.description = updated.description;
      if (updated.featuredImage !== undefined) dbUpdates.featured_image = updated.featuredImage || null;
      if (updated.registrationUrl !== undefined) dbUpdates.registration_url = updated.registrationUrl;
      if (updated.registrationStatus !== undefined) dbUpdates.registration_status = updated.registrationStatus;
      if (updated.capacity !== undefined) {
        dbUpdates.capacity = updated.capacity
          ? parseInt(String(updated.capacity), 10)
          : null;
      }
      if (updated.activities !== undefined) dbUpdates.activities = updated.activities;
      if (updated.schedule !== undefined) dbUpdates.schedule = updated.schedule;
      if (updated.highlights !== undefined) dbUpdates.highlights = updated.highlights;
      if (updated.isPublished !== undefined) dbUpdates.is_published = updated.isPublished;
      if (updated.isCompleted !== undefined) dbUpdates.is_completed = updated.isCompleted;

      if (Object.keys(dbUpdates).length === 0) return;

      const { data, error } = await supabase
        .from('meetups')
        .update(dbUpdates)
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Meetup ${id} was not found or could not be updated.`);

      setMeetups(prev =>
        prev.map(meetup => {
          if (meetup.id !== id) return meetup;
          const nextStartsAt = typeof dbUpdates.starts_at === 'string' ? dbUpdates.starts_at : meetup.startsAt;
          const next = { ...meetup, ...updated, startsAt: nextStartsAt };
          return { ...next, isUpcoming: isMeetupUpcoming(next) };
        })
      );
    } catch (error) {
      console.error('Failed to update meetup:', error);
      throw error;
    }
  };

  const deleteMeetup = async (id: string) => {
    // Offline/demo mode.
    if (!isSupabaseConfigured) {
      setMeetups(prev => prev.filter(meetup => meetup.id !== id));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meetups')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Meetup ${id} was not found or could not be deleted.`);

      setMeetups(prev => prev.filter(meetup => meetup.id !== id));
    } catch (error) {
      console.error('Failed to delete meetup:', error);
    }
  };

  // Article CRUD
  const addArticle = async (articleData: Omit<JournalArticle, 'id'>) => {
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const localArticle: JournalArticle = {
      ...articleData,
      id: `journal-${Date.now()}`,
    };

    // Offline/demo mode.
    if (!isSupabaseConfigured) {
      setArticles(prev => [localArticle, ...prev]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('articles')
        .insert({
          title: articleData.title,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          author: articleData.author,
          author_role: articleData.authorRole || null,
          category: articleData.category,
          language: articleData.language,
          reading_time: articleData.readingTime || null,
          cover_image: articleData.coverImage || null,
          excerpt: articleData.excerpt,
          content: articleData.content,
          tags: articleData.tags,
          featured: articleData.featured || false,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error('Article was not saved: no database ID returned.');

      setArticles(prev => [{ ...localArticle, id: data.id }, ...prev]);
    } catch (error) {
      console.error('Failed to create article:', error);
    }
  };

  const updateArticle = async (id: string, updated: Partial<JournalArticle>) => {
    // Offline/demo mode.
    if (!isSupabaseConfigured) {
      setArticles(prev =>
        prev.map(article => article.id === id ? { ...article, ...updated } : article)
      );
      return;
    }

    try {
      const dbUpdates: Record<string, unknown> = {};

      if (updated.title !== undefined) dbUpdates.title = updated.title;
      if (updated.author !== undefined) dbUpdates.author = updated.author;
      if (updated.authorRole !== undefined) dbUpdates.author_role = updated.authorRole;
      if (updated.category !== undefined) dbUpdates.category = updated.category;
      if (updated.language !== undefined) dbUpdates.language = updated.language;
      if (updated.readingTime !== undefined) dbUpdates.reading_time = updated.readingTime;
      if (updated.coverImage !== undefined) dbUpdates.cover_image = updated.coverImage || null;
      if (updated.excerpt !== undefined) dbUpdates.excerpt = updated.excerpt;
      if (updated.content !== undefined) dbUpdates.content = updated.content;
      if (updated.tags !== undefined) dbUpdates.tags = updated.tags;
      if (updated.featured !== undefined) dbUpdates.featured = updated.featured;

      if (Object.keys(dbUpdates).length === 0) return;

      const { data, error } = await supabase
        .from('articles')
        .update(dbUpdates)
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Article ${id} was not found or could not be updated.`);

      setArticles(prev =>
        prev.map(article => article.id === id ? { ...article, ...updated } : article)
      );
    } catch (error) {
      console.error('Failed to update article:', error);
    }
  };

  const deleteArticle = async (id: string) => {
    // Offline/demo mode.
    if (!isSupabaseConfigured) {
      setArticles(prev => prev.filter(article => article.id !== id));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Article ${id} was not found or could not be deleted.`);

      setArticles(prev => prev.filter(article => article.id !== id));
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };


  // Gallery CRUD
  const addGalleryItem = async (item: Omit<GalleryItem, 'id'>) => {
    const localItem: GalleryItem = {
      ...item,
      id: `gal-${Date.now()}`,
    };

    if (!isSupabaseConfigured) {
      setGallery(prev => [localItem, ...prev]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .insert({
          title: item.title,
          caption: item.caption || null,
          image_path: item.imageUrl,
          meetup_id: item.meetupId || null,
          display_order: gallery.length + 1,
          is_published: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error('Gallery item was not saved.');

      setGallery(prev => [{ ...localItem, id: data.id }, ...prev]);
    } catch (error) {
      console.error('Failed to create gallery item:', error);
    }
  };

 const deleteGalleryItem = async (id: string) => {
  if (!isSupabaseConfigured) {
    setGallery(prev => prev.filter(item => item.id !== id));
    return;
  }

  try {
    // 1. Retrieve paths before deleting the database record.
    const { data: galleryItem, error: fetchError } = await supabase
      .from('gallery_images')
      .select('image_path, thumbnail_path')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!galleryItem) {
      throw new Error(`Gallery item ${id} was not found.`);
    }

    // 2. Delete the database record first.
    const { data: deletedItem, error: deleteError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (deleteError) throw deleteError;

    if (!deletedItem) {
      throw new Error(`Gallery item ${id} could not be deleted.`);
    }

    // 3. Reflect the successful database deletion immediately.
    setGallery(prev => prev.filter(item => item.id !== id));

    // 4. Only consider valid private Storage paths.
    const imagePath = isStoragePath(galleryItem.image_path)
      ? galleryItem.image_path
      : null;

    const thumbnailPath = isStoragePath(galleryItem.thumbnail_path)
      ? galleryItem.thumbnail_path
      : null;

    // Instagram URLs and other external media need no Storage cleanup.
    if (!imagePath && !thumbnailPath) return;

    // 5. Check whether another gallery record references each object.
    let imagePathToDelete: string | null = null;
    let thumbnailPathToDelete: string | null = null;

    if (imagePath) {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('id')
        .eq('image_path', imagePath)
        .limit(1);

      if (error) {
        console.warn(
          'Could not verify remaining image references. Preserving Storage object.',
          error
        );
      } else if (!data || data.length === 0) {
        imagePathToDelete = imagePath;
      }
    }

    if (thumbnailPath) {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('id')
        .eq('thumbnail_path', thumbnailPath)
        .limit(1);

      if (error) {
        console.warn(
          'Could not verify remaining thumbnail references. Preserving Storage object.',
          error
        );
      } else if (!data || data.length === 0) {
        thumbnailPathToDelete = thumbnailPath;
      }
    }

    // 6. Remove only confirmed-unreferenced private Storage objects.
    if (imagePathToDelete || thumbnailPathToDelete) {
      const cleanup = await deleteUploadedGalleryStorageObjects(
        imagePathToDelete,
        thumbnailPathToDelete
      );

      if (!cleanup.ok) {
        console.warn(
          'Gallery database record was deleted, but some Storage objects could not be cleaned up:',
          cleanup.errors
        );
      }
    }
  } catch (error) {
    console.error('Failed to delete gallery item:', error);
  }
};

  /**
   * Secure community photograph upload handler.
   *
   * Workflow:
   * 1. Validates metadata (title, caption) and file constraints (format, 20 MB max).
   * 2. Generates an optimized WebP thumbnail client-side (max 640px, non-upscaled).
   * 3. Uploads original photo to private `roa-gallery` bucket with collision-resistant path.
   * 4. Uploads thumbnail to private `roa-thumbnails` bucket.
   * 5. Inserts a record into `gallery_images` with `is_published: true`.
   * 6. Updates React gallery state only after successful database insertion.
   * 7. If database insertion fails, rolls back both storage objects and preserves the original error.
   */
  const uploadGalleryItem = async (
    file: File,
    title: string,
    caption?: string
  ): Promise<{ ok: boolean; error?: string; item?: GalleryItem }> => {
    // 1. Validate metadata
    const trimmedTitle = (title || '').trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 200) {
      return {
        ok: false,
        error: 'Image title must be between 2 and 200 characters in length.'
      };
    }

    const trimmedCaption = (caption || '').trim();
    if (trimmedCaption.length > 1000) {
      return {
        ok: false,
        error: 'Image caption must not exceed 1000 characters in length.'
      };
    }

    // Validate file (format, constraints, signature)
    const fileValidation = await validateGalleryImageFile(file);
    if (!fileValidation.valid) {
      return {
        ok: false,
        error: fileValidation.error || 'The selected file does not meet gallery requirements.'
      };
    }

    // 2. Prepare thumbnail
    let prepared;
    try {
      prepared = await prepareGalleryImage(file);
    } catch (err: any) {
      return {
        ok: false,
        error: `Thumbnail preparation failed: ${err?.message || err}`
      };
    }

    // 3 & 4. Upload original and thumbnail to Supabase Storage
    let storagePaths;
    try {
      storagePaths = await uploadGalleryImages(
        prepared.originalFile,
        prepared.thumbnailBlob,
        prepared.mimeType
      );
    } catch (err: any) {
      return {
        ok: false,
        error: `Storage upload failed: ${err?.message || err}`
      };
    }

    const { imagePath, thumbnailPath } = storagePaths;

    // 5. Insert record into `gallery_images` table
    try {
      const { data, error: dbError } = await supabase
        .from('gallery_images')
        .insert({
          title: trimmedTitle,
          caption: trimmedCaption || null,
          image_path: imagePath,
          thumbnail_path: thumbnailPath,
          display_order: gallery.length + 1,
          is_published: true,
        })
        .select('id, title, caption, image_path, thumbnail_path, created_at, meetup_id')
        .single();

      if (dbError) throw dbError;
      if (!data?.id) throw new Error('Database record was not returned after insertion.');

      // 8 & 9. Update React gallery state only after successful database insertion
      const newItem: GalleryItem = {
        id: data.id,
        title: data.title,
        caption: data.caption || '',
        imageUrl: data.image_path,
        thumbnailUrl: data.thumbnail_path || undefined,
        meetupId: data.meetup_id || undefined,
        date: new Date(data.created_at || Date.now()).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        })
      };

      setGallery(prev => [newItem, ...prev]);

      return { ok: true, item: newItem };
    } catch (dbError: any) {
      console.error('Failed to create gallery database record:', dbError);

      // Attempt to clean up both uploaded storage objects
      const cleanupResult = await deleteUploadedGalleryStorageObjects(imagePath, thumbnailPath);
      const cleanupReport = cleanupResult.ok
        ? 'Uploaded storage objects were safely rolled back.'
        : `Warning: Failed to clean up storage objects: ${cleanupResult.errors.join('; ')}`;

      const preservedError = `Database insertion failed: ${dbError?.message || dbError}. ${cleanupReport}`;
      return {
        ok: false,
        error: preservedError
      };
    }
  };

  // Announcements CRUD
  const addAnnouncement = async (
    item: Omit<Announcement, 'id' | 'createdAt'>
  ): Promise<{ ok: boolean; error?: string }> => {
    const localAnnouncement: Announcement = {
      ...item,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      setAnnouncements(prev => [localAnnouncement, ...prev]);
      return { ok: true };
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: item.title,
          content: item.content,
          action_url: item.actionUrl || null,
          is_published: item.isPublished,
          published_at: item.publishedAt || new Date().toISOString(),
          expires_at: item.expiresAt || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error('Announcement was not saved.');

      setAnnouncements(prev => [
        { ...localAnnouncement, id: data.id },
        ...prev,
      ]);
      return { ok: true };
    } catch (error) {
      console.error('Failed to create announcement:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to create announcement.' };
    }
  };

  const updateAnnouncement = async (
    id: string,
    item: Partial<Announcement>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      setAnnouncements(prev =>
        prev.map(a => a.id === id ? { ...a, ...item } : a)
      );
      return { ok: true };
    }

    try {
      const dbUpdates: Record<string, unknown> = {};

      if (item.title !== undefined) dbUpdates.title = item.title;
      if (item.content !== undefined) dbUpdates.content = item.content;
      if (item.actionUrl !== undefined) dbUpdates.action_url = item.actionUrl || null;
      if (item.isPublished !== undefined) dbUpdates.is_published = item.isPublished;
      if (item.publishedAt !== undefined) dbUpdates.published_at = item.publishedAt;
      if (item.expiresAt !== undefined) dbUpdates.expires_at = item.expiresAt || null;

      if (Object.keys(dbUpdates).length === 0) return { ok: true };

      const { data, error } = await supabase
        .from('announcements')
        .update(dbUpdates)
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Announcement ${id} was not found or could not be updated.`);

      setAnnouncements(prev =>
        prev.map(a => a.id === id ? { ...a, ...item } : a)
      );
      return { ok: true };
    } catch (error) {
      console.error('Failed to update announcement:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to update announcement.' };
    }
  };

  const deleteAnnouncement = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      return { ok: true };
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Announcement ${id} was not found or could not be deleted.`);

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      return { ok: true };
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to delete announcement.' };
    }
  };

  // Registrations Handling (Public RSVP & Admin Management)
  const addRegistration = async (
    regData: Omit<Registration, 'id' | 'createdAt' | 'status'>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (regData.consent !== true) {
      return { ok: false, error: 'Explicit consent is required to register for this gathering.' };
    }

    const trimmedName = (regData.name || '').trim();
    const trimmedEmail = (regData.email || '').trim().toLowerCase();
    const trimmedPhone = regData.phone ? regData.phone.trim() : null;
    const trimmedMessage = regData.message ? regData.message.trim() : null;

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      return { ok: false, error: 'Full name must be between 2 and 100 characters.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    if (trimmedPhone && trimmedPhone.length > 30) {
      return { ok: false, error: 'Phone number cannot exceed 30 characters.' };
    }

    if (trimmedMessage && trimmedMessage.length > 1000) {
      return { ok: false, error: 'Message cannot exceed 1000 characters.' };
    }

    const newReg: Registration = {
      ...regData,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone || undefined,
      message: trimmedMessage || undefined,
      consent: regData.consent,
      id: `reg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    // Offline/demo mode.
    if (!isSupabaseConfigured) {
      if (adminRole === 'admin') {
        setRegistrations(prev => [newReg, ...prev]);
      }
      return { ok: true };
    }

    try {
      let data: { id: string };

      if (adminRole === 'admin') {
        const result = await supabase
          .from('registrations')
          .insert({
            meetup_id: regData.meetupId,
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            message: trimmedMessage,
            consent: regData.consent,
          })
          .select('id')
          .single();

        if (result.error) throw result.error;
        if (!result.data?.id) throw new Error('Registration could not be confirmed.');
        data = result.data;
      } else {
        const { error } = await supabase
          .from('registrations')
          .insert({
            meetup_id: regData.meetupId,
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            message: trimmedMessage,
            consent: regData.consent,
          });

        if (error) throw error;
        return { ok: true };
      }

      // Only retain registrations in memory if caller is an authorized administrator
      if (adminRole === 'admin') {
        setRegistrations(prev => [
          { ...newReg, id: data.id },
          ...prev,
        ]);
      }

      return { ok: true };
    } catch (error) {
      console.error('Failed to create registration:', error);

      return {
        ok: false,
        error: error instanceof Error
          ? error.message
          : 'Unable to register for this gathering.',
      };
    }
  };

  const updateRegistrationStatus = async (
    id: string,
    status: Registration['status']
  ) => {
    if (adminRole !== 'admin') {
      console.warn('Unauthorized attempt to update registration status');
      return;
    }

    if (!isSupabaseConfigured) {
      setRegistrations(prev =>
        prev.map(r => r.id === id ? { ...r, status } : r)
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from('registrations')
        .update({ status })
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Registration ${id} was not found or could not be updated.`);

      setRegistrations(prev =>
        prev.map(r => r.id === id ? { ...r, status } : r)
      );
    } catch (error) {
      console.error('Failed to update registration status:', error);
    }
  };

  const deleteRegistration = async (id: string) => {
    if (adminRole !== 'admin') {
      console.warn('Unauthorized attempt to delete registration');
      return;
    }

    if (!isSupabaseConfigured) {
      setRegistrations(prev => prev.filter(r => r.id !== id));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Registration ${id} was not found or could not be deleted.`);

      setRegistrations(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete registration:', error);
    }
  };

  // Stories CRUD
  const addStory = (storyData: Omit<ReaderStory, 'id'>) => {
    const newStory: ReaderStory = {
      ...storyData,
      id: `story-${Date.now()}`
    };
    setStories(prev => [newStory, ...prev]);
  };

  const deleteStory = (id: string) => {
    setStories(prev => prev.filter(s => s.id !== id));
  };

  // Meetup Reels Management
  const addReel = async (
    reelData: Omit<MeetupReel, 'id' | 'createdAt'>,
    videoFile?: File | Blob
  ): Promise<string> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured for reel persistence.');
    }

    const { id, newReel } = await executeCreateReel({
      reelData,
      videoFile,
      existingReels: reels,
      supabaseClient: supabase,
      saveBlob: saveVideoBlob,
    });

    setReels(prev => [...prev, newReel]);
    return id;
  };

  const updateReel = async (id: string, updates: Partial<MeetupReel>) => {
    setReels(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

    try {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.caption !== undefined) dbUpdates.caption = updates.caption;
      if (updates.order !== undefined) dbUpdates.display_order = updates.order;
      if (updates.published !== undefined) dbUpdates.is_published = updates.published;

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('reels').update(dbUpdates).eq('id', id);
      }
    } catch (e) {
      console.warn('Updated reel locally; database sync failed:', e);
    }
  };

  const deleteReel = async (id: string) => {
    // Revoke in-memory object URL if this was a locally-uploaded reel to avoid memory leaks
    const target = reels.find(r => r.id === id);
    if (target?.videoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(target.videoUrl);
    }

    try {
      await deleteVideoBlob(id);
    } catch (e) {
      console.warn('Error deleting reel blob from IndexedDB:', e);
    }
    setReels(prev => prev.filter(r => r.id !== id));

    try {
      await supabase.from('reels').delete().eq('id', id);
    } catch (e) {
      console.warn('Deleted reel locally; database sync failed:', e);
    }
  };


  const reorderReels = async (newOrderReels: MeetupReel[]) => {
    const normalized = newOrderReels.map((reel, index) => ({
      ...reel,
      order: index + 1,
    }));

    if (!isSupabaseConfigured) {
      setReels(normalized);
      return;
    }

    try {
      for (const reel of normalized) {
        const { data, error } = await supabase
          .from('reels')
          .update({ display_order: reel.order })
          .eq('id', reel.id)
          .select('id')
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          throw new Error(`Reel ${reel.id} was not found or could not be reordered.`);
        }
      }

      setReels(normalized);
    } catch (error) {
      console.error('Failed to reorder reels:', error);
    }
  };

  const togglePublishReel = async (id: string) => {
    const target = reels.find(reel => reel.id === id);
    if (!target) return;

    const nextPub = !(target.published ?? target.isPublished ?? true);

    if (!isSupabaseConfigured) {
      setReels(prev =>
        prev.map(reel =>
          reel.id === id
            ? { ...reel, published: nextPub, isPublished: nextPub }
            : reel
        )
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reels')
        .update({ is_published: nextPub })
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Reel ${id} was not found or could not be updated.`);

      setReels(prev =>
        prev.map(reel =>
          reel.id === id
            ? { ...reel, published: nextPub, isPublished: nextPub }
            : reel
        )
      );
    } catch (error) {
      console.error('Failed to update reel publication status:', error);
    }
  };

  // Enquiry handling
  const addEnquiry = async (
    enquiryData: Omit<Enquiry, 'id' | 'createdAt' | 'status'>
  ) => {
    if (!isSupabaseConfigured) {
      throw new Error('Enquiry submission is currently unavailable. Please try again later.');
    }

    if (enquiryData.consent !== true) {
      throw new Error('Explicit consent is required to submit an enquiry.');
    }

    const trimmedName = (enquiryData.name || '').trim();
    const trimmedEmail = (enquiryData.email || '').trim().toLowerCase();
    const trimmedPhone = enquiryData.phone ? enquiryData.phone.trim() : null;
    const trimmedMessage = (enquiryData.message || '').trim();

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      throw new Error('Full name must be between 2 and 100 characters.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
      throw new Error('Please enter a valid email address.');
    }

    if (trimmedPhone && trimmedPhone.length > 30) {
      throw new Error('Phone number cannot exceed 30 characters.');
    }

    if (!trimmedMessage || trimmedMessage.length < 5 || trimmedMessage.length > 2000) {
      throw new Error('Message must be between 5 and 2000 characters.');
    }

    const validTypes: EnquiryType[] = ['volunteer', 'book_donation', 'collaboration', 'contact'];
    if (!validTypes.includes(enquiryData.type)) {
      throw new Error('Invalid enquiry category.');
    }

    let data: { id: string };

    if (adminRole === 'admin') {
      const result = await supabase
        .from('enquiries')
        .insert({
          type: enquiryData.type,
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          message: trimmedMessage,
          details: enquiryData.details || {},
          consent: enquiryData.consent,
        })
        .select('id')
        .single();

      if (result.error) {
        throw new Error(result.error.message || 'Unable to submit your message at this time.');
      }

      if (!result.data?.id) {
        throw new Error('Your enquiry could not be confirmed. Please try again.');
      }
      data = result.data;
    } else {
      const { error } = await supabase
        .from('enquiries')
        .insert({
          type: enquiryData.type,
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          message: trimmedMessage,
          details: enquiryData.details || {},
          consent: enquiryData.consent,
        });

      if (error) {
        throw new Error(error.message || 'Unable to submit your message at this time.');
      }
      return;
    }

    // Only retain enquiries in memory if the caller is an authenticated administrator
    if (adminRole === 'admin') {
      const newEnquiry: Enquiry = {
        ...enquiryData,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || undefined,
        message: trimmedMessage,
        consent: enquiryData.consent,
        id: data.id,
        createdAt: new Date().toISOString(),
        status: 'new',
      };

      setEnquiries(prev => [newEnquiry, ...prev]);
    }
  };

  const updateEnquiryStatus = async (
    id: string,
    status: Enquiry['status']
  ) => {
    if (adminRole !== 'admin') {
      console.warn('Unauthorized attempt to update enquiry status');
      return;
    }

    if (!isSupabaseConfigured) {
      setEnquiries(prev =>
        prev.map(enquiry =>
          enquiry.id === id ? { ...enquiry, status } : enquiry
        )
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from('enquiries')
        .update({ status })
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Enquiry ${id} was not found or could not be updated.`);

      setEnquiries(prev =>
        prev.map(enquiry =>
          enquiry.id === id ? { ...enquiry, status } : enquiry
        )
      );
    } catch (error) {
      console.error('Failed to update enquiry status:', error);
    }
  };

  const deleteEnquiry = async (id: string) => {
    if (adminRole !== 'admin') {
      console.warn('Unauthorized attempt to delete enquiry');
      return;
    }

    if (!isSupabaseConfigured) {
      setEnquiries(prev => prev.filter(enquiry => enquiry.id !== id));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('enquiries')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Enquiry ${id} was not found or could not be deleted.`);

      setEnquiries(prev => prev.filter(enquiry => enquiry.id !== id));
    } catch (error) {
      console.error('Failed to delete enquiry:', error);
    }
  };

  // Staff Profile Management (Admin Only)
  const updateStaffProfile = async (
    id: string,
    updates: { role?: 'admin' | 'editor' | null; designation?: string }
  ): Promise<{ ok: boolean; error?: string }> => {
    if (adminRole !== 'admin') {
      return {
        ok: false,
        error: 'Only administrators can modify staff privileges.',
      };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(`Staff profile ${id} was not found or could not be updated.`);
      }

      setStaffProfiles(prev =>
        prev.map(profile =>
          profile.id === id ? { ...profile, ...updates } : profile
        )
      );

      return { ok: true };
    } catch (error) {
      console.error('Failed to update staff profile:', error);

      return {
        ok: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to update staff profile.',
      };
    }
  };


  // Instagram Media Library Operations
  const updateInstagramConfig = (cfg: Partial<InstagramAuthConfig>) => {
    setInstagramConfig(prev => sanitizeInstagramConfig({ ...prev, ...cfg }));
  };

  const disconnectInstagram = () => {
    setInstagramConfig({
      connected: false,
      username: 'readers.of.aurangabad',
      accountType: 'CREATOR',
      lastSyncedAt: undefined
    });
  };

  const importInstagramMedia = (items: InstagramMediaItem[]): { added: number; skippedDuplicates: number } => {
    const existingIds = new Set(instagramMedia.map(p => p.id));
    const newItems: InstagramMediaItem[] = [];
    let skippedDuplicates = 0;

    for (const item of items) {
      if (existingIds.has(item.id)) {
        skippedDuplicates++;
      } else {
        newItems.push({
          ...item,
          status: 'draft',
        });
        existingIds.add(item.id);
      }
    }

    if (newItems.length > 0) {
      setInstagramMedia(prev => [...newItems, ...prev]);
    }

    return { added: newItems.length, skippedDuplicates };
  };

  const deleteInstagramMedia = (id: string) => {
    setInstagramMedia(prev => prev.filter(m => m.id !== id));
  };

  const updateInstagramMedia = (id: string, updates: Partial<InstagramMediaItem>) => {
    setInstagramMedia(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const togglePublishInstagramMedia = (id: string) => {
    setInstagramMedia(prev => prev.map(m => {
      if (m.id !== id) return m;
      const newStatus = m.status === 'published' ? 'draft' : 'published';
      return { ...m, status: newStatus };
    }));
  };

  const addExtractedFramesToMediaLibrary = (frames: ExtractedFrame[], sourceVideo: InstagramMediaItem) => {
    const newItems: InstagramMediaItem[] = frames.map(frame => ({
      id: `extracted-${frame.id}`,
      caption: `[Extracted Frame at ${frame.formattedTimestamp}] from: ${sourceVideo.caption.slice(0, 100)}...`,
      mediaType: 'IMAGE',
      mediaUrl: frame.dataUrl,
      thumbnailUrl: frame.dataUrl,
      permalink: sourceVideo.permalink,
      timestamp: new Date().toISOString(),
      category: sourceVideo.category,
      status: 'draft',
      isCustomUpload: true
    }));

    setInstagramMedia(prev => [...newItems, ...prev]);

    updateInstagramMedia(sourceVideo.id, {
      extractedFrames: [...(sourceVideo.extractedFrames || []), ...frames]
    });
  };

  const assignMediaToTarget = (mediaUrl: string, target: 'meetup' | 'journal' | 'hero' | 'gallery', targetId?: string) => {
    if (target === 'gallery') {
      void addGalleryItem({
        title: 'Community Highlight',
        caption: 'Featured from @readers.of.aurangabad Instagram collection',
        imageUrl: mediaUrl,
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    } else if (target === 'meetup' && targetId) {
      void updateMeetup(targetId, { featuredImage: mediaUrl });
    } else if (target === 'journal' && targetId) {
      void updateArticle(targetId, { coverImage: mediaUrl });
    }
  };

  // --- MEMBER NOTIFICATIONS & AUTH ---
  const refreshNotifications = useCallback(async () => {
    if (!isSupabaseConfigured || !currentAuthUserId) {
      setMemberNotifications([]);
      return;
    }

    await Promise.resolve();
    setNotificationsLoading(true);
    try {
      const [{ data: notificationsData, error: notificationsError }, { data: receiptsData, error: receiptsError }] = await Promise.all([
        supabase
          .from('notifications')
          .select('id, type, title, message, meetup_id, announcement_id, action_url, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('notification_receipts')
          .select('notification_id, read_at')
          .eq('member_id', currentAuthUserId),
      ]);

      if (notificationsError) throw notificationsError;
      if (receiptsError) throw receiptsError;

      const receiptMap = new Map<string, string>();
      (receiptsData || []).forEach(r => {
        receiptMap.set(r.notification_id, r.read_at);
      });

      const mapped: MemberNotification[] = (notificationsData || []).map(n => ({
        id: n.id,
        type: n.type as MemberNotification['type'],
        title: n.title,
        message: n.message,
        meetupId: n.meetup_id || undefined,
        announcementId: n.announcement_id || undefined,
        actionUrl: n.action_url || undefined,
        createdAt: n.created_at,
        readAt: receiptMap.get(n.id) || null,
      }));

      setMemberNotifications(mapped);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [currentAuthUserId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !currentAuthUserId) {
      if (notificationChannelRef.current) {
        supabase.removeChannel(notificationChannelRef.current).catch(() => {});
        notificationChannelRef.current = null;
      }
      return;
    }

    queueMicrotask(() => {
      void refreshNotifications();
    });

    const channel = supabase
      .channel(`member-notifications-${currentAuthUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          void refreshNotifications();
        }
      )
      .subscribe();

    notificationChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel).catch(() => {});
      if (notificationChannelRef.current === channel) {
        notificationChannelRef.current = null;
      }
    };
  }, [currentAuthUserId, refreshNotifications]);

  const markNotificationRead = async (notificationId: string) => {
    if (!isSupabaseConfigured || !currentAuthUserId) return;
    const readAt = new Date().toISOString();
    setMemberNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, readAt: n.readAt || readAt } : n));
    try {
      const { error } = await supabase
        .from('notification_receipts')
        .upsert({
          notification_id: notificationId,
          member_id: currentAuthUserId,
          read_at: readAt,
        }, { onConflict: 'notification_id,member_id' });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!isSupabaseConfigured || !currentAuthUserId) return;
    const readAt = new Date().toISOString();
    const unreadIds = memberNotifications.filter(n => !n.readAt).map(n => n.id);
    if (unreadIds.length === 0) return;

    setMemberNotifications(prev => prev.map(n => n.readAt ? n : { ...n, readAt }));
    try {
      const rows = unreadIds.map(id => ({
        notification_id: id,
        member_id: currentAuthUserId,
        read_at: readAt,
      }));
      const { error } = await supabase
        .from('notification_receipts')
        .upsert(rows, { onConflict: 'notification_id,member_id' });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const loginMember = async (email: string, password: string): Promise<{ ok: boolean; error?: string; needsVerification?: boolean }> => {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured for this deployment.' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, error: error.message };
      if (!data?.user) return { ok: false, error: 'Unable to sign in.' };

      const sessionRes = await supabase.auth.getSession();
      if (sessionRes.data.session) {
        await authCoordinatorRef.current.resolveSession(sessionRes.data.session, undefined, supabase, {
          onLoading: setAdminAuthLoading,
          onResetState: () => {
            currentRoleRef.current = null;
            currentUserIdRef.current = null;
            resetAuthState();
          },
          onAuthenticated: ({ userId, email: userEmail, role, designation }) => {
            currentRoleRef.current = role;
            currentUserIdRef.current = userId;
            setAdminRole(role);
            setIsAdmin(true);
            setCurrentUserEmail(userEmail);
            setCurrentUserDesignation(designation);
            setCurrentAuthUserId(userId);
            setIsMember(false);
            setAdminAuthLoading(false);
          },
          onMemberAuthenticated: ({ userId, email: userEmail }) => {
            currentRoleRef.current = null;
            currentUserIdRef.current = userId;
            setAdminRole(null);
            setIsAdmin(false);
            setCurrentUserDesignation(null);
            setCurrentUserEmail(userEmail);
            setCurrentAuthUserId(userId);
            setIsMember(true);
            setAdminAuthLoading(false);
          },
          onRefreshNeeded: () => { void refreshData(); },
        });
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to sign in.' };
    }
  };

  const requestMemberMagicLink = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured for this deployment.' };
    }
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        // Accounts are provisioned administratively; the public sign-in form
        // must never be able to create new users.
        shouldCreateUser: false,
      },
    });

    if (error && /signups?\s+not\s+allowed|user\s+not\s+found/i.test(error.message)) {
      // Do not disclose whether the address belongs to an existing account.
      return { ok: true };
    }

    return error ? { ok: false, error: error.message } : { ok: true };
  };

  const logoutMember = async (): Promise<{ ok: boolean; error?: string }> => {
    return logoutAdmin();
  };

  const unreadNotificationCount = memberNotifications.filter(n => !n.readAt).length;

  const resetToDefaults = () => {
    setMeetups(initialMeetups.map(normalizeMeetup));
    setArticles(initialArticles);
    // Public reader stories require documented consent; reset to an empty set.
    setStories([]);
    setGallery(initialGallery);
    setEnquiries([]);
    setReels(initialReels);
    setInstagramConfig(INITIAL_INSTAGRAM_CONFIG);
    setInstagramMedia(SAMPLE_INSTAGRAM_POSTS);
    setRegistrations([]);
    setAnnouncements([]);

    // Selectively reset community content items without destroying unrelated or sensitive keys
    const contentKeysToReset = [
      'roa_meetups_v4',
      'roa_articles_v4',
      'roa_stories_v4',
      'roa_gallery_v4',
      'roa_reels_v1',
      'roa_announcements_v1',
      'roa_ig_media',
      'roa_ig_config',
    ];
    for (const key of contentKeysToReset) {
      localStorage.removeItem(key);
    }
  };

  const exportDataJson = (): { ok: boolean; error?: string } => {
    if (!isAdmin || !adminRole) {
      const msg = 'Access denied: You must be an authenticated administrator or editor to export data.';
      console.warn(msg);
      alert(msg);
      return { ok: false, error: msg };
    }

    const isFullAdmin = adminRole === 'admin';
    const timestamp = new Date().toISOString().slice(0, 10);

    const baseData = {
      meetups,
      articles,
      stories,
      gallery,
      announcements,
      reels: reels.map(r => ({ ...r, videoUrl: r.isCustomUpload ? '' : r.videoUrl })),
      instagramMedia,
      instagramConfig: sanitizeInstagramConfig(instagramConfig),
      exportedAt: new Date().toISOString(),
      exportType: isFullAdmin ? 'full_administrative' : 'public_content',
    };

    // Full administrative backup includes attendee PII & enquiries only when caller is verified admin
    // isFullAdmin ? { ...baseData, enquiries, registrations, } : baseData
    // Enforce client-side role and state synchronization checks to govern UI export safety
    const result = buildBackupExport({
      isAdmin,
      adminRole,
      activeRoleRef: currentRoleRef.current,
      activeUserId: currentUserIdRef.current,
      baseData,
      sensitiveData: {
        enquiries,
        registrations,
      },
      timestamp,
    });

    if (!result.ok || !result.exportPayload || !result.filename) {
      const msg = result.error || 'Access denied: You must be an authenticated administrator or editor to export data.';
      console.warn(msg);
      alert(msg);
      return { ok: false, error: msg };
    }

    const exportPayload = result.exportPayload;
    const filename = isFullAdmin
      ? `readers-of-aurangabad-full-backup-${timestamp}.json`
      : `readers-of-aurangabad-content-backup-${timestamp}.json`;

    try {
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      return { ok: true };
    } catch (err: any) {
      const msg = `Export failed: ${err?.message || err}`;
      console.error(msg);
      alert(msg);
      return { ok: false, error: msg };
    }
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        isRTL,
        currentPage,
        setCurrentPage,
        announcementNavigationId,
        navigateToAnnouncement,
        clearAnnouncementNavigation,
        isPageLoading,
        navError,
        retryNavigation,
        selectedArticle,
        setSelectedArticle,
        selectedMeetup,
        setSelectedMeetup,
        meetups,
        articles,
        stories,
        gallery,
        enquiries,
        reels,
        registrations,
        announcements,
        staffProfiles,
        isDbConnected,
        dbLoading,
        refreshData,
        addReel,
        updateReel,
        deleteReel,
        reorderReels,
        togglePublishReel,
        instagramConfig,
        updateInstagramConfig,
        disconnectInstagram,
        instagramMedia,
        importInstagramMedia,
        deleteInstagramMedia,
        updateInstagramMedia,
        togglePublishInstagramMedia,
        addExtractedFramesToMediaLibrary,
        assignMediaToTarget,
        isAdmin,
        adminAuthLoading,
        adminRole,
        currentUserEmail,
        currentUserDesignation,
        loginAdmin,
        logoutAdmin,
        resetAdminPassword,
        requestPasswordReset,
        isPasswordRecovery,
        updatePassword,
        completePasswordRecovery,
        currentUserId: currentAuthUserId,
        isMember,
        memberNotifications,
        unreadNotificationCount,
        notificationsLoading,
        loginMember,
        requestMemberMagicLink,
        logoutMember,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        addMeetup,
        updateMeetup,
        deleteMeetup,
        addArticle,
        updateArticle,
        deleteArticle,
        addGalleryItem,
        uploadGalleryItem,
        deleteGalleryItem,
        getSignedGalleryUrl,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        addRegistration,
        updateRegistrationStatus,
        deleteRegistration,
        addStory,
        deleteStory,
        addEnquiry,
        updateEnquiryStatus,
        deleteEnquiry,
        updateStaffProfile,
        resetToDefaults,
        exportDataJson
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react/only-export-components -- This module intentionally exports its provider and paired context hook.
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
