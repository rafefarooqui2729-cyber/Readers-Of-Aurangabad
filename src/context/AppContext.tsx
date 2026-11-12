import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Language,
  PageRoute,
  Meetup,
  JournalArticle,
  ReaderStory,
  GalleryItem,
  Enquiry,
  InstagramMediaItem,
  InstagramAuthConfig,
  ExtractedFrame,
  MeetupReel,
  Registration,
  Announcement,
  StaffProfile
} from '../types';
import { translations } from '../i18n/translations';
import type { Translations } from '../i18n/translations';
import {
  initialMeetups,
  initialArticles,
  initialReaderStories,
  initialGallery,
  initialEnquiries,
  initialReels
} from '../data/initialData';
import {
  INITIAL_INSTAGRAM_CONFIG,
  SAMPLE_INSTAGRAM_POSTS
} from '../services/instagramService';
import { saveVideoBlob, getVideoObjectUrl, deleteVideoBlob } from '../utils/videoStorage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
  currentPage: PageRoute;
  setCurrentPage: (page: PageRoute) => void;
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
  logoutAdmin: () => Promise<void>;
  resetAdminPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;

  // CRUD Actions
  addMeetup: (meetup: Omit<Meetup, 'id'>) => Promise<void>;
  updateMeetup: (id: string, meetup: Partial<Meetup>) => Promise<void>;
  deleteMeetup: (id: string) => Promise<void>;

  addArticle: (article: Omit<JournalArticle, 'id'>) => Promise<void>;
  updateArticle: (id: string, article: Partial<JournalArticle>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;

  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;

  addAnnouncement: (item: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
  updateAnnouncement: (id: string, item: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

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
  exportDataJson: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('roa_lang') as Language) || 'en';
  });

  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAuthLoading, setAdminAuthLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<'admin' | 'editor' | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserDesignation, setCurrentUserDesignation] = useState<string | null>(null);

  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

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
    return str.includes('unsplash.com') || str.includes('/images/hero/roa-009') || str.includes('photo-15');
  };

  const [meetups, setMeetups] = useState<Meetup[]>(() => {
    return loadWithSanitization('roa_meetups_v4', initialMeetups, hasLegacyUrls);
  });

  const [articles, setArticles] = useState<JournalArticle[]>(() => {
    return loadWithSanitization('roa_articles_v4', initialArticles, hasLegacyUrls);
  });

  const [stories, setStories] = useState<ReaderStory[]>(() => {
    return loadWithSanitization('roa_stories_v4', initialReaderStories, hasLegacyUrls);
  });

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    return loadWithSanitization('roa_gallery_v4', initialGallery, (items) => !Array.isArray(items) || items.length < 12 || hasLegacyUrls(items));
  });

  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => {
    const saved = localStorage.getItem('roa_enquiries_v4');
    return saved ? JSON.parse(saved) : initialEnquiries;
  });

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

  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    const saved = localStorage.getItem('roa_registrations_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('roa_announcements_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>(() => {
    const saved = localStorage.getItem('roa_staff_profiles_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Instagram integration state
  const [instagramConfig, setInstagramConfig] = useState<InstagramAuthConfig>(() => {
    const saved = localStorage.getItem('roa_ig_config');
    return saved ? JSON.parse(saved) : INITIAL_INSTAGRAM_CONFIG;
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

  // IndexedDB custom reel resolver on mount
  useEffect(() => {
    let isMounted = true;
    async function resolveCustomReels() {
      const customReels = reels.filter(r => r.isCustomUpload && (!r.videoUrl || r.videoUrl.startsWith('blob:')));
      if (customReels.length === 0) return;

      const updated = await Promise.all(
        reels.map(async (reel) => {
          if (reel.isCustomUpload) {
            const blobUrl = await getVideoObjectUrl(reel.id);
            if (blobUrl) {
              return { ...reel, videoUrl: blobUrl };
            }
          }
          return reel;
        })
      );

      if (isMounted) {
        setReels(updated);
      }
    }

    resolveCustomReels();
    return () => { isMounted = false; };
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
    localStorage.setItem('roa_enquiries_v4', JSON.stringify(enquiries));
  }, [enquiries]);

  useEffect(() => {
    localStorage.setItem('roa_registrations_v1', JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    localStorage.setItem('roa_announcements_v1', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('roa_staff_profiles_v1', JSON.stringify(staffProfiles));
  }, [staffProfiles]);

  useEffect(() => {
    const metadata = reels.map(r => r.isCustomUpload ? { ...r, videoUrl: '' } : r);
    localStorage.setItem('roa_reels_v1', JSON.stringify(metadata));
  }, [reels]);

  useEffect(() => {
    localStorage.setItem('roa_ig_config', JSON.stringify(instagramConfig));
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
    if (!isSupabaseConfigured) {
      setDbLoading(false);
      setIsDbConnected(false);
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

      if (!meetupsErr && dbMeetups && dbMeetups.length > 0) {
        anySuccess = true;
        const mapped: Meetup[] = dbMeetups.map(m => ({
          id: m.id,
          title: m.title,
          edition: m.edition || undefined,
          date: new Date(m.starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
          time: m.time_label || '8:30 AM – 11:00 AM IST',
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
          isUpcoming: !m.is_completed && new Date(m.starts_at) >= new Date()
        }));
        setMeetups(mapped);
      }

      // 2. Fetch articles
      const { data: dbArticles, error: artErr } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (!artErr && dbArticles && dbArticles.length > 0) {
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

      if (!galErr && dbGallery && dbGallery.length > 0) {
        anySuccess = true;
        const mappedGal: GalleryItem[] = dbGallery.map(g => ({
          id: g.id,
          title: g.title,
          caption: g.caption || '',
          imageUrl: g.image_path,
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

      if (!reelsErr && dbReels && dbReels.length > 0) {
        anySuccess = true;
        const mappedReels: MeetupReel[] = await Promise.all(
          dbReels.map(async r => {
            let playableVideoUrl = r.video_path;
            const playablePosterUrl = r.poster_path || undefined;

            // If video_path is a Supabase Storage path (e.g. "reels/..."), resolve to signed or public URL
            if (r.video_path && !r.video_path.startsWith('http://') && !r.video_path.startsWith('https://') && !r.video_path.startsWith('/') && !r.video_path.startsWith('blob:')) {
              try {
                const { data: signed } = await supabase.storage.from('roa-reels').createSignedUrl(r.video_path, 86400);
                if (signed?.signedUrl) {
                  playableVideoUrl = signed.signedUrl;
                } else {
                  const { data: pub } = supabase.storage.from('roa-reels').getPublicUrl(r.video_path);
                  if (pub?.publicUrl) playableVideoUrl = pub.publicUrl;
                }
              } catch {
                const { data: pub } = supabase.storage.from('roa-reels').getPublicUrl(r.video_path);
                if (pub?.publicUrl) playableVideoUrl = pub.publicUrl;
              }
            }

            return {
              id: r.id,
              title: r.title,
              caption: r.caption || undefined,
              videoUrl: playableVideoUrl,
              posterUrl: playablePosterUrl,
              order: r.display_order,
              published: r.is_published,
              isPublished: r.is_published,
              createdAt: r.created_at,
              durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : undefined,
              isCustomUpload: false
            };
          })
        );
        setReels(mappedReels);
      }

      // 5. Fetch announcements
      const { data: dbAnnouncements, error: annErr } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (!annErr && dbAnnouncements) {
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

      // 6. Admin-only: Registrations
      if (adminRole === 'admin') {
        const { data: dbRegs } = await supabase
          .from('registrations')
          .select('*, meetups(title)')
          .order('created_at', { ascending: false });

        if (dbRegs) {
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

        // 7. Admin-only: Enquiries
        const { data: dbEnqs } = await supabase
          .from('enquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbEnqs) {
          anySuccess = true;
          setEnquiries(dbEnqs.map(e => ({
            id: e.id,
            type: e.type,
            name: e.name,
            email: e.email,
            phone: e.phone || undefined,
            message: e.message,
            details: e.details as Record<string, any>,
            createdAt: e.created_at,
            status: e.status
          })));
        }

        // 8. Admin-only: Profiles
        const { data: dbProfiles } = await supabase
          .from('profiles')
          .select('*')
          .order('role', { ascending: true });

        if (dbProfiles) {
          anySuccess = true;
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
      }

      setIsDbConnected(anySuccess);
    } catch (e) {
      console.warn('Supabase query failed, falling back to local data:', e);
      setIsDbConnected(false);
    } finally {
      setDbLoading(false);
    }
  }, [adminRole]);

  // Initial load
  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  // Admin auth resolution
  useEffect(() => {
    let active = true;

    const resolveAdminSession = async () => {
      if (!isSupabaseConfigured) {
        if (active) {
          setIsAdmin(false);
          setAdminRole(null);
          setCurrentUserEmail(null);
          setCurrentUserDesignation(null);
          setAdminAuthLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !active) {
          if (active) {
            setIsAdmin(false);
            setAdminRole(null);
            setCurrentUserEmail(null);
            setCurrentUserDesignation(null);
            setAdminAuthLoading(false);
          }
          return;
        }

        setCurrentUserEmail(session.user.email || null);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, designation, full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!active) return;
        const role = profile?.role === 'admin' || profile?.role === 'editor'
          ? profile.role
          : null;
        setAdminRole(role);
        setIsAdmin(role !== null);
        setCurrentUserDesignation(profile?.designation || null);
        setAdminAuthLoading(false);
      } catch (err) {
        console.warn('Error resolving admin session:', err);
        if (active) {
          setAdminAuthLoading(false);
        }
      }
    };

    void resolveAdminSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void resolveAdminSession();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginAdmin = async (emailInput: string, passwordInput: string) => {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured for this deployment.' };
    }

    setAdminAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim(),
      password: passwordInput,
    });
    if (error || !data.user) {
      setAdminAuthLoading(false);
      return { ok: false, error: error?.message || 'Unable to sign in.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, designation')
      .eq('id', data.user.id)
      .maybeSingle();
    const role = profile?.role === 'admin' || profile?.role === 'editor'
      ? profile.role
      : null;
    if (!role) {
      await supabase.auth.signOut();
      setAdminAuthLoading(false);
      return { ok: false, error: 'This account does not have administrator or editor access.' };
    }
    setAdminRole(role);
    setIsAdmin(true);
    setCurrentUserEmail(data.user.email || null);
    setCurrentUserDesignation(profile?.designation || null);
    setAdminAuthLoading(false);
    void refreshData();
    return { ok: true };
  };

  const logoutAdmin = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setIsAdmin(false);
    setAdminRole(null);
    setCurrentUserEmail(null);
    setCurrentUserDesignation(null);
    if (currentPage === 'admin') {
      setCurrentPage('home');
    }
  };

  const resetAdminPassword = async (emailInput: string) => {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured for this deployment.' };
    }

    const redirectTo = `${window.location.origin}${window.location.pathname}#/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput.trim(), {
      redirectTo,
    });
    return error
      ? { ok: false, error: error.message }
      : { ok: true };
  };

  // --- CRUD METHODS (SUPABASE FIRST, FALLBACK LOCAL) ---

  /**
   * Parse a meetup date string into an ISO-8601 timestamp suitable for the
   * `starts_at timestamptz` column. Handles both ISO strings and the
   * human-readable locale format produced by the UI ("Sunday, November 15, 2026").
   * Rejects invalid or empty date strings by throwing an explicit Error rather than
   * silently corrupting records with the current date.
   */
  const parseMeetupDate = (dateStr: string): string => {
    if (!dateStr || !dateStr.trim()) {
      throw new Error('Meetup date cannot be empty.');
    }

    // ISO date / timestamp — fast path
    const direct = new Date(dateStr);
    if (!isNaN(direct.getTime())) return direct.toISOString();

    // Human-readable with weekday prefix: "Sunday, November 15, 2026"
    // Strip the weekday token and try again
    const stripped = dateStr.replace(/^[A-Za-z]+,\s*/, '').trim();
    const withoutWeekday = new Date(stripped);
    if (!isNaN(withoutWeekday.getTime())) return withoutWeekday.toISOString();

    throw new Error(`Invalid meetup date format: "${dateStr}". Please provide a valid date format.`);
  };


  // Meetup CRUD
  const addMeetup = async (meetupData: Omit<Meetup, 'id'>) => {
    const slug = meetupData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const localMeetup: Meetup = {
      ...meetupData,
      id: `meetup-${Date.now()}`,
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
          starts_at: parseMeetupDate(meetupData.date),
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
          is_published: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error('Meetup was not saved: no database ID returned.');

      setMeetups(prev => [{ ...localMeetup, id: data.id }, ...prev]);
    } catch (error) {
      console.error('Failed to create meetup:', error);
    }
  };

  const updateMeetup = async (id: string, updated: Partial<Meetup>) => {
    // Offline/demo mode.
    if (!isSupabaseConfigured) {
      setMeetups(prev =>
        prev.map(meetup => meetup.id === id ? { ...meetup, ...updated } : meetup)
      );
      return;
    }

    try {
      const dbUpdates: Record<string, unknown> = {};

      if (updated.title !== undefined) dbUpdates.title = updated.title;
      if (updated.edition !== undefined) dbUpdates.edition = updated.edition;
      if (updated.date !== undefined) dbUpdates.starts_at = parseMeetupDate(updated.date);
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
        prev.map(meetup => meetup.id === id ? { ...meetup, ...updated } : meetup)
      );
    } catch (error) {
      console.error('Failed to update meetup:', error);
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
      const { data, error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(`Gallery item ${id} was not found or could not be deleted.`);

      setGallery(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete gallery item:', error);
    }
  };

  // Announcements CRUD
  const addAnnouncement = async (
    item: Omit<Announcement, 'id' | 'createdAt'>
  ) => {
    const localAnnouncement: Announcement = {
      ...item,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      setAnnouncements(prev => [localAnnouncement, ...prev]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: item.title,
          content: item.content,
          action_url: item.actionUrl || null,
          is_published: item.isPublished,
          published_at: item.publishedAt,
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
    } catch (error) {
      console.error('Failed to create announcement:', error);
    }
  };

  const updateAnnouncement = async (
    id: string,
    item: Partial<Announcement>
  ) => {
    if (!isSupabaseConfigured) {
      setAnnouncements(prev =>
        prev.map(a => a.id === id ? { ...a, ...item } : a)
      );
      return;
    }

    try {
      const dbUpdates: Record<string, unknown> = {};

      if (item.title !== undefined) dbUpdates.title = item.title;
      if (item.content !== undefined) dbUpdates.content = item.content;
      if (item.actionUrl !== undefined) dbUpdates.action_url = item.actionUrl;
      if (item.isPublished !== undefined) dbUpdates.is_published = item.isPublished;
      if (item.publishedAt !== undefined) dbUpdates.published_at = item.publishedAt;
      if (item.expiresAt !== undefined) dbUpdates.expires_at = item.expiresAt;

      if (Object.keys(dbUpdates).length === 0) return;

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
    } catch (error) {
      console.error('Failed to update announcement:', error);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!isSupabaseConfigured) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      return;
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
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  // Registrations Handling (Public RSVP & Admin Management)
  const addRegistration = async (
    regData: Omit<Registration, 'id' | 'createdAt' | 'status'>
  ): Promise<{ ok: boolean; error?: string }> => {
    const newReg: Registration = {
      ...regData,
      id: `reg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    // Offline/demo mode.
    if (!isSupabaseConfigured) {
      setRegistrations(prev => [newReg, ...prev]);
      return { ok: true };
    }

    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          meetup_id: regData.meetupId,
          name: regData.name.trim(),
          email: regData.email.trim(),
          phone: regData.phone ? regData.phone.trim() : null,
          message: regData.message ? regData.message.trim() : null,
          consent: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error('Registration could not be confirmed.');

      setRegistrations(prev => [
        { ...newReg, id: data.id },
        ...prev,
      ]);

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
    const id = `reel-${Date.now()}`;
    let finalVideoUrl = reelData.videoUrl;
    let storagePath: string | null = null;
    let isCustomUpload = reelData.isCustomUpload ?? false;

    if (videoFile) {
      isCustomUpload = true;

      // 1. Upload to Supabase Storage (roa-reels bucket)
      try {
        const ext = (videoFile instanceof File && videoFile.name)
          ? videoFile.name.split('.').pop()?.toLowerCase() || 'mp4'
          : 'mp4';
        storagePath = `reels/${id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('roa-reels')
          .upload(storagePath, videoFile, {
            contentType: videoFile.type || 'video/mp4',
            upsert: false
          });

        if (uploadError) {
          console.warn('Supabase Storage upload failed, falling back to IndexedDB:', uploadError.message);
          storagePath = null;
        }
      } catch (uploadErr) {
        console.warn('Supabase Storage upload error, falling back to IndexedDB:', uploadErr);
        storagePath = null;
      }

      // 2. Always keep local blob for immediate playback
      await saveVideoBlob(id, videoFile);
      finalVideoUrl = URL.createObjectURL(videoFile);
    }

    const calculatedOrder = reelData.order ?? (reels.length > 0 ? Math.max(...reels.map(r => r.order)) + 1 : 1);
    const isPub = reelData.published ?? reelData.isPublished ?? true;
    const newReel: MeetupReel = {
      ...reelData,
      id,
      videoUrl: finalVideoUrl,
      order: calculatedOrder,
      published: isPub,
      isPublished: isPub,
      isCustomUpload,
      createdAt: new Date().toISOString()
    };

    setReels(prev => [...prev, newReel]);

    // 3. Insert into reels table (for both uploaded files and external URLs)
    const dbVideoPath = storagePath ?? (reelData.videoUrl || null);
    if (dbVideoPath) {
      try {
        const { data: inserted } = await supabase.from('reels').insert({
          title: reelData.title,
          caption: reelData.caption || null,
          video_path: dbVideoPath,
          poster_path: reelData.posterUrl || null,
          display_order: calculatedOrder,
          is_published: isPub
        }).select('id').single();

        // Update local state with the real DB UUID so future operations target the correct row
        if (inserted?.id) {
          setReels(prev => prev.map(r => r.id === id ? { ...r, id: inserted.id } : r));
        }
      } catch (e) {
        console.warn('Reel saved locally; database sync failed:', e);
      }
    }

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

    const { data, error } = await supabase
      .from('enquiries')
      .insert({
        type: enquiryData.type,
        name: enquiryData.name.trim(),
        email: enquiryData.email.trim(),
        phone: enquiryData.phone ? enquiryData.phone.trim() : null,
        message: enquiryData.message.trim(),
        details: enquiryData.details || {},
        consent: true,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message || 'Unable to submit your message at this time.');
    }

    if (!data?.id) {
      throw new Error('Your enquiry could not be confirmed. Please try again.');
    }

    const newEnquiry: Enquiry = {
      ...enquiryData,
      id: data.id,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    setEnquiries(prev => [newEnquiry, ...prev]);
  };

  const updateEnquiryStatus = async (
    id: string,
    status: Enquiry['status']
  ) => {
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
    setInstagramConfig(prev => ({ ...prev, ...cfg }));
  };

  const disconnectInstagram = () => {
    setInstagramConfig({
      connected: false,
      username: 'readers.of.aurangabad',
      accountType: 'CREATOR',
      accessToken: undefined,
      tokenExpiry: undefined,
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

  const resetToDefaults = () => {
    setMeetups(initialMeetups);
    setArticles(initialArticles);
    setStories(initialReaderStories);
    setGallery(initialGallery);
    setEnquiries(initialEnquiries);
    setReels(initialReels);
    setInstagramConfig(INITIAL_INSTAGRAM_CONFIG);
    setInstagramMedia(SAMPLE_INSTAGRAM_POSTS);
    setRegistrations([]);
    setAnnouncements([]);
    localStorage.clear();
  };

  const exportDataJson = () => {
    const data = {
      meetups,
      articles,
      stories,
      gallery,
      enquiries,
      registrations,
      announcements,
      reels: reels.map(r => ({ ...r, videoUrl: r.isCustomUpload ? '' : r.videoUrl })),
      instagramMedia,
      instagramConfig,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readers-of-aurangabad-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        addMeetup,
        updateMeetup,
        deleteMeetup,
        addArticle,
        updateArticle,
        deleteArticle,
        addGalleryItem,
        deleteGalleryItem,
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

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
