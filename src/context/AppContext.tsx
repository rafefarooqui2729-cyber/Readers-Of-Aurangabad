import React, { createContext, useContext, useState, useEffect } from 'react';
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
  ExtractedFrame
} from '../types';
import { translations } from '../i18n/translations';
import type { Translations } from '../i18n/translations';
import { 
  initialMeetups, 
  initialArticles, 
  initialReaderStories, 
  initialGallery, 
  initialEnquiries 
} from '../data/initialData';
import { 
  INITIAL_INSTAGRAM_CONFIG, 
  SAMPLE_INSTAGRAM_POSTS 
} from '../services/instagramService';

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
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  
  // CRUD Actions
  addMeetup: (meetup: Omit<Meetup, 'id'>) => void;
  updateMeetup: (id: string, meetup: Partial<Meetup>) => void;
  deleteMeetup: (id: string) => void;
  
  addArticle: (article: Omit<JournalArticle, 'id'>) => void;
  updateArticle: (id: string, article: Partial<JournalArticle>) => void;
  deleteArticle: (id: string) => void;
  
  addStory: (story: Omit<ReaderStory, 'id'>) => void;
  deleteStory: (id: string) => void;
  
  addEnquiry: (enquiry: Omit<Enquiry, 'id' | 'createdAt' | 'status'>) => void;
  updateEnquiryStatus: (id: string, status: Enquiry['status']) => void;
  deleteEnquiry: (id: string) => void;
  
  resetToDefaults: () => void;
  exportDataJson: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ADMIN_PASSCODE = 'roa2026';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('roa_lang') as Language) || 'en';
  });

  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('roa_admin_auth') === 'true';
  });

  // LocalStorage-backed state with auto-migration to flush legacy stock/Unsplash URLs
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

  // Clear legacy keys once
  useEffect(() => {
    [
      'roa_meetups', 'roa_articles', 'roa_stories', 'roa_gallery',
      'roa_meetups_v3', 'roa_articles_v3', 'roa_stories_v3', 'roa_gallery_v3'
    ].forEach(k => {
      localStorage.removeItem(k);
    });
  }, []);

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

  // Instagram integration state
  const [instagramConfig, setInstagramConfig] = useState<InstagramAuthConfig>(() => {
    const saved = localStorage.getItem('roa_ig_config');
    return saved ? JSON.parse(saved) : INITIAL_INSTAGRAM_CONFIG;
  });

  const [instagramMedia, setInstagramMedia] = useState<InstagramMediaItem[]>(() => {
    const saved = localStorage.getItem('roa_ig_media');
    return saved ? JSON.parse(saved) : SAMPLE_INSTAGRAM_POSTS;
  });

  // Keep localStorage updated
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

  // Admin auth
  const loginAdmin = (password: string): boolean => {
    if (password === ADMIN_PASSCODE || password === 'admin@roa') {
      setIsAdmin(true);
      sessionStorage.setItem('roa_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('roa_admin_auth');
    if (currentPage === 'admin') {
      setCurrentPage('home');
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
          status: 'draft', // Draft by default as required by prompt
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

  // Add extracted video frames as standalone media library items
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
      status: 'draft', // Draft until approved
      isCustomUpload: true
    }));

    setInstagramMedia(prev => [...newItems, ...prev]);

    // Also update source video's extractedFrames list
    updateInstagramMedia(sourceVideo.id, {
      extractedFrames: [...(sourceVideo.extractedFrames || []), ...frames]
    });
  };

  // Assign any media URL directly to a website section (Meetup, Journal, Hero, Community Gallery)
  const assignMediaToTarget = (mediaUrl: string, target: 'meetup' | 'journal' | 'hero' | 'gallery', targetId?: string) => {
    if (target === 'gallery') {
      const newGal: GalleryItem = {
        id: `gal-${Date.now()}`,
        title: 'Community Highlight',
        caption: 'Featured from @readers.of.aurangabad Instagram collection',
        imageUrl: mediaUrl,
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
      setGallery(prev => [newGal, ...prev]);
    } else if (target === 'meetup' && targetId) {
      updateMeetup(targetId, { featuredImage: mediaUrl });
    } else if (target === 'journal' && targetId) {
      updateArticle(targetId, { coverImage: mediaUrl });
    }
  };

  // Meetup CRUD
  const addMeetup = (meetupData: Omit<Meetup, 'id'>) => {
    const newMeetup: Meetup = {
      ...meetupData,
      id: `meetup-${Date.now()}`
    };
    setMeetups(prev => [newMeetup, ...prev]);
  };

  const updateMeetup = (id: string, updated: Partial<Meetup>) => {
    setMeetups(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
  };

  const deleteMeetup = (id: string) => {
    setMeetups(prev => prev.filter(m => m.id !== id));
  };

  // Article CRUD
  const addArticle = (articleData: Omit<JournalArticle, 'id'>) => {
    const newArticle: JournalArticle = {
      ...articleData,
      id: `journal-${Date.now()}`
    };
    setArticles(prev => [newArticle, ...prev]);
  };

  const updateArticle = (id: string, updated: Partial<JournalArticle>) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
  };

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  // Story CRUD
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

  // Enquiry handling
  const addEnquiry = (enquiryData: Omit<Enquiry, 'id' | 'createdAt' | 'status'>) => {
    const newEnquiry: Enquiry = {
      ...enquiryData,
      id: `enq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    setEnquiries(prev => [newEnquiry, ...prev]);
  };

  const updateEnquiryStatus = (id: string, status: Enquiry['status']) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const deleteEnquiry = (id: string) => {
    setEnquiries(prev => prev.filter(e => e.id !== id));
  };

  const resetToDefaults = () => {
    setMeetups(initialMeetups);
    setArticles(initialArticles);
    setStories(initialReaderStories);
    setGallery(initialGallery);
    setEnquiries(initialEnquiries);
    setInstagramConfig(INITIAL_INSTAGRAM_CONFIG);
    setInstagramMedia(SAMPLE_INSTAGRAM_POSTS);
    localStorage.clear();
  };

  const exportDataJson = () => {
    const data = {
      meetups,
      articles,
      stories,
      gallery,
      enquiries,
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
        loginAdmin,
        logoutAdmin,
        addMeetup,
        updateMeetup,
        deleteMeetup,
        addArticle,
        updateArticle,
        deleteArticle,
        addStory,
        deleteStory,
        addEnquiry,
        updateEnquiryStatus,
        deleteEnquiry,
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
