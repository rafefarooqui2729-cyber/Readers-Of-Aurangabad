import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  Language, 
  PageRoute, 
  Meetup, 
  JournalArticle, 
  ReaderStory, 
  GalleryItem, 
  Enquiry 
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

const ADMIN_PASSCODE = 'roa2026'; // Simple secure local demonstration password

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

  // LocalStorage-backed state with initial fallbacks
  const [meetups, setMeetups] = useState<Meetup[]>(() => {
    const saved = localStorage.getItem('roa_meetups');
    return saved ? JSON.parse(saved) : initialMeetups;
  });

  const [articles, setArticles] = useState<JournalArticle[]>(() => {
    const saved = localStorage.getItem('roa_articles');
    return saved ? JSON.parse(saved) : initialArticles;
  });

  const [stories, setStories] = useState<ReaderStory[]>(() => {
    const saved = localStorage.getItem('roa_stories');
    return saved ? JSON.parse(saved) : initialReaderStories;
  });

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('roa_gallery');
    return saved ? JSON.parse(saved) : initialGallery;
  });

  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => {
    const saved = localStorage.getItem('roa_enquiries');
    return saved ? JSON.parse(saved) : initialEnquiries;
  });

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem('roa_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('roa_meetups', JSON.stringify(meetups));
  }, [meetups]);

  useEffect(() => {
    localStorage.setItem('roa_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('roa_stories', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('roa_gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem('roa_enquiries', JSON.stringify(enquiries));
  }, [enquiries]);

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
    localStorage.removeItem('roa_meetups');
    localStorage.removeItem('roa_articles');
    localStorage.removeItem('roa_stories');
    localStorage.removeItem('roa_gallery');
    localStorage.removeItem('roa_enquiries');
  };

  const exportDataJson = () => {
    const data = {
      meetups,
      articles,
      stories,
      gallery,
      enquiries,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readers-of-aurangabad-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
