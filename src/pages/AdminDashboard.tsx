import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type {
  Meetup,
  JournalCategory,
  Language,
  Registration,
  Enquiry
} from '../types';
import {
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  LogOut,
  Calendar,
  Inbox,
  FileText,
  Film,
  ArrowUp,
  ArrowDown,
  UploadCloud,
  AlertTriangle,
  Users,
  Image as ImageIcon,
  Bell,
  Database,
  HardDrive,
  CheckCircle2,
  Search,
  UserCheck
} from 'lucide-react';
import { InstagramIcon } from '../components/Icons';
import { InstagramMediaLibrary } from '../components/InstagramMediaLibrary';

const CATEGORIES: JournalCategory[] = [
  'Reader Stories',
  'Personal Essays',
  'Book Reflections',
  'Literature & Culture',
  'Poetry',
  'Opinions',
  'Creative Writing',
  'Community Experiences'
];

type AdminTab =
  | 'overview'
  | 'meetups'
  | 'registrations'
  | 'gallery'
  | 'reels'
  | 'announcements'
  | 'articles'
  | 'instagram'
  | 'enquiries'
  | 'users'
  | 'media'
  | 'settings';

export const AdminDashboard: React.FC = () => {
  const {
    isAdmin,
    adminAuthLoading,
    adminRole,
    currentUserEmail,
    currentUserDesignation,
    loginAdmin,
    logoutAdmin,
    resetAdminPassword,
    isDbConnected,
    dbLoading,
    refreshData,
    meetups,
    addMeetup,
    deleteMeetup,
    articles,
    addArticle,
    deleteArticle,
    gallery,
    addGalleryItem,
    deleteGalleryItem,
    enquiries,
    updateEnquiryStatus,
    deleteEnquiry,
    registrations,
    updateRegistrationStatus,
    deleteRegistration,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    staffProfiles,
    updateStaffProfile,
    reels,
    addReel,
    deleteReel,
    reorderReels,
    togglePublishReel,
    instagramMedia,
    exportDataJson
  } = useApp();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Search and Filter states
  const [meetupSearch, setMeetupSearch] = useState('');
  const [articleSearch, setArticleSearch] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [regMeetupFilter, setRegMeetupFilter] = useState('all');
  const [enqTypeFilter, setEnqTypeFilter] = useState('all');
  const [enqSearch, setEnqSearch] = useState('');

  // Meetup Creation State
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mEdition, setMEdition] = useState('Chapter 15');
  const [mDate, setMDate] = useState('Sunday, November 29, 2026');
  const [mTime, setMTime] = useState('8:30 AM – 11:00 AM IST');
  const [mVenue, setMVenue] = useState('Siddharth Garden / Historic Grounds');
  const [mAddress, setMAddress] = useState('Aurangabad, Maharashtra');
  const [mDesc, setMDesc] = useState('');
  const [mImage, setMImage] = useState('/images/enhanced/community/meetup-card-1.webp');
  const [mRegUrl, setMRegUrl] = useState('https://forms.gle/readers-of-aurangabad');
  const [mStatus, setMStatus] = useState<Meetup['registrationStatus']>('open');
  const [mCapacity, setMCapacity] = useState('40');
  const [mIsUpcoming, setMIsUpcoming] = useState(true);

  // Article Creation State
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [aTitle, setATitle] = useState('');
  const [aAuthor, setAAuthor] = useState('Abdul Rafe Farooqui');
  const [aRole, setARole] = useState('Founder, Readers of Aurangabad');
  const [aCategory, setACategory] = useState<JournalCategory>('Literature & Culture');
  const [aLang, setALang] = useState<Language>('en');
  const [aReadTime, setAReadTime] = useState('5');
  const [aCover, setACover] = useState('/images/enhanced/gallery/roa-019-2026-11-05.webp');
  const [aExcerpt, setAExcerpt] = useState('');
  const [aContent, setAContent] = useState('');

  // Gallery Creation State
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [gTitle, setGTitle] = useState('');
  const [gCaption, setGCaption] = useState('');
  const [gImageUrl, setGImageUrl] = useState('/images/enhanced/gallery/roa-006-2026-11-05.webp');

  // Announcement Creation State
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annUrl, setAnnUrl] = useState('');

  // Reel Upload State
  const [showReelUploadModal, setShowReelUploadModal] = useState(false);
  const [reelVideoFile, setReelVideoFile] = useState<File | null>(null);
  const [reelVideoPreviewUrl, setReelVideoPreviewUrl] = useState('');
  const [reelTitle, setReelTitle] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [isUploadingReel, setIsUploadingReel] = useState(false);
  const [reelUploadProgress, setReelUploadProgress] = useState(0);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setResetMessage('');
    const result = await loginAdmin(email, password);
    if (result.ok) {
      setLoginError('');
      setPassword('');
    } else {
      setLoginError(result.error || 'Unable to sign in.');
    }
  };

  const handleResetPassword = async () => {
    setLoginError('');
    setResetMessage('');
    if (!email.trim()) {
      setLoginError('Enter your administrator email before requesting a password reset.');
      return;
    }
    const result = await resetAdminPassword(email);
    setResetMessage(result.ok
      ? 'Password reset instructions have been sent to your email.'
      : result.error || 'Unable to send password reset instructions.');
  };

  // Create Meetup
  const handleCreateMeetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;

    void addMeetup({
      edition: mEdition.trim(),
      title: mTitle.trim(),
      date: mDate.trim(),
      time: mTime.trim(),
      venue: mVenue.trim(),
      address: mAddress.trim(),
      description: mDesc.trim(),
      featuredImage: mImage.trim(),
      registrationUrl: mRegUrl.trim(),
      rsvpLink: mRegUrl.trim(),
      capacity: mCapacity.trim() || undefined,
      activities: ['Silent Reading', 'Passage Discussion', 'Book Swap'],
      isUpcoming: mIsUpcoming,
      registrationStatus: mStatus,
      schedule: [
        { time: '8:30 AM', activity: 'Arrival & Welcome under the trees' },
        { time: '8:45 AM', activity: 'Quiet, uninterrupted personal reading' },
        { time: '10:15 AM', activity: 'Gentle book discussion & passages sharing' },
        { time: '11:00 AM', activity: 'Closing circle & group photograph' }
      ]
    });

    setShowMeetupModal(false);
    setMTitle('');
    setMDesc('');
  };

  // Create Article
  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aTitle.trim() || !aContent.trim()) return;

    void addArticle({
      title: aTitle.trim(),
      slug: aTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      author: aAuthor.trim(),
      authorRole: aRole.trim(),
      category: aCategory,
      publishedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      readingTime: aReadTime.trim(),
      coverImage: aCover.trim(),
      excerpt: aExcerpt.trim(),
      content: aContent.trim(),
      language: aLang,
      tags: ['Aurangabad', aCategory]
    });

    setShowArticleModal(false);
    setATitle('');
    setAExcerpt('');
    setAContent('');
  };

  // Create Gallery
  const handleCreateGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle.trim() || !gImageUrl.trim()) return;

    void addGalleryItem({
      title: gTitle.trim(),
      caption: gCaption.trim(),
      imageUrl: gImageUrl.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    });

    setShowGalleryModal(false);
    setGTitle('');
    setGCaption('');
  };

  // Create Announcement
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    void addAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      actionUrl: annUrl.trim() || undefined,
      isPublished: true,
      publishedAt: new Date().toISOString()
    });

    setShowAnnModal(false);
    setAnnTitle('');
    setAnnContent('');
    setAnnUrl('');
  };

  // Reel file selection with validation
  const handleReelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert('Selected video file exceeds 100MB limit. Please compress or select a smaller video.');
      return;
    }

    // Revoke previous preview URL to avoid memory leak before creating a new one
    setReelVideoPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });

    setReelVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setReelVideoPreviewUrl(objectUrl);
  };

  /** Revoke the preview object URL and reset all reel upload state. */
  const resetReelUploadState = () => {
    setReelVideoFile(null);
    setReelVideoPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setReelTitle('');
    setReelCaption('');
    setReelUploadProgress(0);
    setIsUploadingReel(false);
  };

  // Upload new reel
  const handleUploadReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelVideoFile) {
      alert('Please choose an MP4 video file to upload.');
      return;
    }
    if (!reelTitle.trim()) {
      alert('Please enter a title for the reel.');
      return;
    }

    setIsUploadingReel(true);
    setReelUploadProgress(20);

    const progressTimer = setInterval(() => {
      setReelUploadProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressTimer);
          return 85;
        }
        return prev + 15;
      });
    }, 150);

    try {
      await addReel({
        title: reelTitle.trim(),
        caption: reelCaption.trim(),
        videoUrl: '',
        order: reels.length + 1,
        published: true,
        isPublished: true,
        isCustomUpload: true
      }, reelVideoFile);

      clearInterval(progressTimer);
      setReelUploadProgress(100);

      setTimeout(() => {
        setShowReelUploadModal(false);
        resetReelUploadState();
      }, 400);
    } catch (err) {
      clearInterval(progressTimer);
      setIsUploadingReel(false);
      console.error('Error saving reel:', err);
      alert('Could not save reel. Please try again.');
    }
  };

  // Reorder reels
  const handleMoveReel = (currentIndex: number, direction: 'up' | 'down') => {
    const sorted = [...reels].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const item = sorted[currentIndex];
    sorted.splice(currentIndex, 1);
    sorted.splice(targetIndex, 0, item);
    void reorderReels(sorted);
  };

  // Export registrations CSV
  const handleExportRegistrationsCSV = () => {
    if (registrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }
    const headers = ['ID', 'Meetup', 'Attendee Name', 'Email', 'Phone', 'Status', 'Date', 'Message'];
    const rows = registrations.map(r => [
      r.id,
      r.meetupTitle || r.meetupId,
      `"${r.name.replace(/"/g, '""')}"`,
      r.email,
      r.phone || '',
      r.status,
      new Date(r.createdAt).toLocaleDateString(),
      `"${(r.message || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `readers-of-aurangabad-registrations-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Meetups
  const filteredMeetups = useMemo(() => {
    if (!meetupSearch.trim()) return meetups;
    const q = meetupSearch.toLowerCase();
    return meetups.filter(m => m.title.toLowerCase().includes(q) || m.venue.toLowerCase().includes(q));
  }, [meetups, meetupSearch]);

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    if (!articleSearch.trim()) return articles;
    const q = articleSearch.toLowerCase();
    return articles.filter(a => a.title.toLowerCase().includes(q) || a.author.toLowerCase().includes(q));
  }, [articles, articleSearch]);

  // Filtered Registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      const matchSearch = !regSearch.trim() || r.name.toLowerCase().includes(regSearch.toLowerCase()) || r.email.toLowerCase().includes(regSearch.toLowerCase());
      const matchMeetup = regMeetupFilter === 'all' || r.meetupId === regMeetupFilter;
      return matchSearch && matchMeetup;
    });
  }, [registrations, regSearch, regMeetupFilter]);

  // Filtered Enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(e => {
      const matchType = enqTypeFilter === 'all' || e.type === enqTypeFilter;
      const matchSearch = !enqSearch.trim() || e.name.toLowerCase().includes(enqSearch.toLowerCase()) || e.email.toLowerCase().includes(enqSearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [enquiries, enqTypeFilter, enqSearch]);

  const newEnquiriesCount = enquiries.filter(e => e.status === 'new').length;
  const newRegistrationsCount = registrations.filter(r => r.status === 'new').length;

  // Render Login Gate
  if (!isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 paper-grain">
        <div className="glass-card max-w-md w-full p-8 sm:p-10 rounded-3xl relative overflow-hidden border-white/60 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#455240] via-[#8D5B4C] to-[#B88B4A]" />

          <div className="text-center space-y-3 mb-8">
            <div className="w-14 h-14 rounded-2xl glass-dark mx-auto flex items-center justify-center text-[#B88B4A] shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B1A]">
              Staff Sign In
            </h1>
            <p className="text-xs text-[#595550] leading-relaxed max-w-xs mx-auto">
              Authorized portal for Founders and Community Leads of Readers of Aurangabad.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1B1A] mb-1.5">
                Staff Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@readersofaurangabad.com"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#1C1B1A]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[11px] text-[#455240] hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {resetMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{resetMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={adminAuthLoading}
              className="w-full py-3 rounded-xl glass-button text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
            >
              {adminAuthLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate to Portal</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E8E2D5] text-center">
            <span className="text-[11px] text-[#8C857B] block">
              Protected by PostgreSQL Row-Level Security & Role Anti-Tamper Engine
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render Authenticated Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 paper-grain">

      {/* Top Identity & Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#455240] text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{adminRole === 'admin' ? 'Founder (Admin)' : 'Community Lead (Editor)'}</span>
            </span>

            {/* Supabase Database Connection Badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isDbConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <Database className="w-3 h-3" />
              <span>{isDbConnected ? 'Supabase Live' : 'Local Fallback'}</span>
            </span>

            {currentUserDesignation && (
              <span className="text-xs text-[#595550] italic font-serif">
                "{currentUserDesignation}"
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B1A]">
            Administrative Portal
          </h1>
          <p className="text-xs text-[#595550]">
            Signed in as <span className="font-semibold text-[#1C1B1A]">{currentUserEmail}</span>
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void refreshData()}
            disabled={dbLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-button-secondary text-xs font-semibold cursor-pointer"
            title="Refresh live data from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dbLoading ? 'animate-spin' : ''}`} />
            <span>Sync DB</span>
          </button>

          <button
            onClick={exportDataJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-button-secondary text-xs font-semibold cursor-pointer"
            title="Export full JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup JSON</span>
          </button>

          <button
            onClick={() => void logoutAdmin()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-button text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[#E8E2D5] pb-3 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview' ? 'glass-button' : 'glass-button-secondary'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('meetups')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'meetups' ? 'glass-button' : 'glass-button-secondary'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Meetups ({meetups.length})</span>
        </button>

        {/* Registrations Tab - Admin Only */}
        <button
          onClick={() => {
            if (adminRole !== 'admin') {
              alert('Restricted: Attendee registrations contain personal contact information accessible only to the Founder.');
              return;
            }
            setActiveTab('registrations');
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'registrations'
              ? 'glass-button'
              : adminRole !== 'admin'
                ? 'opacity-60 bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'glass-button-secondary'
          }`}
        >
          {adminRole !== 'admin' ? <Lock className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          <span>Registrations ({registrations.length})</span>
          {newRegistrationsCount > 0 && adminRole === 'admin' && (
            <span className="w-4 h-4 rounded-full bg-[#8D5B4C] text-white text-[10px] flex items-center justify-center">
              {newRegistrationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'gallery' ? 'glass-button' : 'glass-button-secondary'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Gallery ({gallery.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'reels' ? 'glass-button' : 'glass-button-secondary'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Reels ({reels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'announcements' ? 'glass-button' : 'glass-button-secondary'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Announcements ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'articles' ? 'glass-button' : 'glass-button-secondary'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Journal ({articles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('instagram')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'instagram' ? 'glass-button' : 'glass-button-secondary'
          }`}
        >
          <InstagramIcon className="w-3.5 h-3.5" />
          <span>Instagram ({instagramMedia.length})</span>
        </button>

        {/* Inquiries Tab - Admin Only */}
        <button
          onClick={() => {
            if (adminRole !== 'admin') {
              alert('Restricted: Contact inquiries contain private messages accessible only to the Founder.');
              return;
            }
            setActiveTab('enquiries');
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'enquiries'
              ? 'glass-button'
              : adminRole !== 'admin'
                ? 'opacity-60 bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'glass-button-secondary'
          }`}
        >
          {adminRole !== 'admin' ? <Lock className="w-3.5 h-3.5" /> : <Inbox className="w-3.5 h-3.5" />}
          <span>Inquiries ({enquiries.length})</span>
          {newEnquiriesCount > 0 && adminRole === 'admin' && (
            <span className="w-4 h-4 rounded-full bg-[#8D5B4C] text-white text-[10px] flex items-center justify-center">
              {newEnquiriesCount}
            </span>
          )}
        </button>

        {/* User Roles - Admin Only */}
        {adminRole === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'users' ? 'glass-button' : 'glass-button-secondary'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff & Roles</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('media')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'media' ? 'glass-button' : 'glass-button-secondary'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Storage</span>
        </button>
      </div>

      {/* --- TAB 1: OVERVIEW & STATS --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Total Gatherings</span>
              <span className="font-serif text-3xl font-bold text-[#1C1B1A] block mt-1">{meetups.length}</span>
              <span className="text-xs text-[#455240] block mt-1">
                {meetups.filter(m => m.isUpcoming).length} upcoming scheduled
              </span>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Registrations</span>
              <span className="font-serif text-3xl font-bold text-[#1C1B1A] block mt-1">
                {adminRole === 'admin' ? registrations.length : 'Protected (Admin)'}
              </span>
              <span className="text-xs text-[#8D5B4C] block mt-1">
                {adminRole === 'admin' ? `${newRegistrationsCount} new attendees` : 'Founder Access Only'}
              </span>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Journal Articles</span>
              <span className="font-serif text-3xl font-bold text-[#1C1B1A] block mt-1">{articles.length}</span>
              <span className="text-xs text-[#455240] block mt-1">Published community writings</span>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Meetup Reels</span>
              <span className="font-serif text-3xl font-bold text-[#1C1B1A] block mt-1">{reels.length}</span>
              <span className="text-xs text-[#455240] block mt-1">
                {reels.filter(r => r.published ?? r.isPublished).length} published
              </span>
            </div>
          </div>

          {/* Quick Shortcuts & Permissions Banner */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4 border border-white/60">
            <h3 className="font-serif text-lg font-bold text-[#1C1B1A]">
              System Operational Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/70 border border-[#E8E2D5] space-y-2">
                <span className="font-semibold text-[#1C1B1A] block">Current Access Tier</span>
                <p className="text-[#595550] leading-relaxed">
                  {adminRole === 'admin'
                    ? 'Founder / Full Administrator: You have unrestricted access to manage meetups, gallery images, articles, video reels, attendee registration PII, contact enquiries, and staff roles.'
                    : 'Community Lead / Editor: You can publish and curate meetups, reels, gallery items, and articles. Attendee registrations and member inquiries are strictly protected and hidden.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/70 border border-[#E8E2D5] space-y-2">
                <span className="font-semibold text-[#1C1B1A] block">Supabase Backend Link</span>
                <p className="text-[#595550] leading-relaxed">
                  {isDbConnected
                    ? 'Connected to Supabase project rtjulebzjiwbnizqwxjn. Row-Level Security policies are actively enforced server-side.'
                    : 'Operating in local client fallback mode. Once you execute the migration in Supabase SQL Editor, click "Sync DB" above to link live data.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: MEETUPS MANAGEMENT --- */}
      {activeTab === 'meetups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8C857B]" />
              <input
                type="text"
                placeholder="Search meetups by title or venue..."
                value={meetupSearch}
                onChange={(e) => setMeetupSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <button
              onClick={() => setShowMeetupModal(true)}
              className="glass-button px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Gathering</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetups.map(m => (
              <div key={m.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border-white/60">
                <div className="relative h-40 bg-[#1C1B1A]">
                  <img src={m.featuredImage} alt={m.title} className="w-full h-full object-cover opacity-85" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {m.edition && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8D5B4C] text-white uppercase">
                        {m.edition}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-[#1C1B1A] uppercase">
                      {m.registrationStatus}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1C1B1A] leading-snug">{m.title}</h3>
                    <p className="text-xs text-[#595550] mt-1 line-clamp-2">{m.description}</p>
                    <div className="mt-3 text-xs text-[#8C857B] space-y-1">
                      <span className="block font-medium">{m.date} • {m.time}</span>
                      <span className="block">{m.venue}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D5]">
                    <span className="text-[11px] font-semibold text-[#455240]">
                      Capacity: {m.capacity || 'Unlimited'}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete meetup "${m.title}"?`)) {
                          void deleteMeetup(m.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete meetup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: REGISTRATIONS MANAGEMENT (ADMIN ONLY) --- */}
      {activeTab === 'registrations' && adminRole === 'admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8C857B]" />
                <input
                  type="text"
                  placeholder="Search attendee by name or email..."
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <select
                value={regMeetupFilter}
                onChange={(e) => setRegMeetupFilter(e.target.value)}
                className="px-3 py-2 rounded-xl glass-input text-xs"
              >
                <option value="all">All Gatherings</option>
                {meetups.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportRegistrationsCSV}
              className="glass-button px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border-white/60">
            {filteredRegistrations.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#8C857B]">
                No attendee registrations recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1C1B1A]/5 text-[#595550] border-b border-[#E8E2D5] font-semibold">
                    <tr>
                      <th className="p-3.5">Attendee</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Gathering</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {filteredRegistrations.map(r => (
                      <tr key={r.id} className="hover:bg-white/40 transition-colors">
                        <td className="p-3.5 font-semibold text-[#1C1B1A]">
                          {r.name}
                          {r.message && (
                            <span className="block text-[11px] font-normal text-[#595550] italic line-clamp-1">
                              "{r.message}"
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="block">{r.email}</span>
                          {r.phone && <span className="block text-[11px] text-[#8C857B]">{r.phone}</span>}
                        </td>
                        <td className="p-3.5 text-[#455240] font-medium">
                          {r.meetupTitle || 'Community Gathering'}
                        </td>
                        <td className="p-3.5">
                          <select
                            value={r.status}
                            onChange={(e) => void updateRegistrationStatus(r.id, e.target.value as Registration['status'])}
                            className="px-2 py-1 rounded-lg text-xs font-semibold glass-input"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="resolved">Confirmed</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-[11px] text-[#8C857B]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Remove registration for ${r.name}?`)) {
                                void deleteRegistration(r.id);
                              }
                            }}
                            className="p-1 rounded text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: GALLERY MANAGEMENT --- */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#1C1B1A]">
              Community Photography ({gallery.length})
            </h3>
            <button
              onClick={() => setShowGalleryModal(true)}
              className="glass-button px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Photograph</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {gallery.map(item => (
              <div key={item.id} className="glass-card rounded-2xl overflow-hidden group relative">
                <div className="aspect-square bg-[#1C1B1A]">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C1B1A] truncate">{item.title}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete photograph "${item.title}"?`)) {
                        void deleteGalleryItem(item.id);
                      }
                    }}
                    className="p-1 rounded text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 5: REELS MANAGEMENT --- */}
      {activeTab === 'reels' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#1C1B1A]">
              Sequential Meetup Reels ({reels.length})
            </h3>
            <button
              onClick={() => setShowReelUploadModal(true)}
              className="glass-button px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Reel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reels.map((reel, idx) => (
              <div key={reel.id} className="glass-card rounded-2xl p-5 space-y-4 flex flex-col justify-between border-white/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8D5B4C]">Reel #{reel.order}</span>
                  <button
                    onClick={() => void togglePublishReel(reel.id)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                      reel.published ?? reel.isPublished
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {reel.published ?? reel.isPublished ? 'Published' : 'Draft'}
                  </button>
                </div>

                <div>
                  <h4 className="font-serif text-base font-bold text-[#1C1B1A]">{reel.title}</h4>
                  {reel.caption && <p className="text-xs text-[#595550] mt-1 line-clamp-2">{reel.caption}</p>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D5]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveReel(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-white/60 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveReel(idx, 'down')}
                      disabled={idx === reels.length - 1}
                      className="p-1 rounded hover:bg-white/60 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete reel "${reel.title}"?`)) {
                        void deleteReel(reel.id);
                      }
                    }}
                    className="p-1.5 rounded text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 6: ANNOUNCEMENTS --- */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#1C1B1A]">
              Live Notices & Announcements ({announcements.length})
            </h3>
            <button
              onClick={() => setShowAnnModal(true)}
              className="glass-button px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Announcement</span>
            </button>
          </div>

          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="glass-card p-12 text-center text-xs text-[#8C857B] rounded-2xl">
                No active announcements published yet.
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="glass-card p-5 rounded-2xl flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-[#1C1B1A]">{ann.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ann.isPublished ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                        {ann.isPublished ? 'Active' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-[#595550] leading-relaxed">{ann.content}</p>
                    {ann.actionUrl && (
                      <a href={ann.actionUrl} target="_blank" rel="noreferrer" className="text-xs text-[#455240] hover:underline font-semibold block mt-1">
                        Action Link: {ann.actionUrl}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete announcement "${ann.title}"?`)) {
                        void deleteAnnouncement(ann.id);
                      }
                    }}
                    className="p-1.5 rounded text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 7: ARTICLES MANAGEMENT --- */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8C857B]" />
              <input
                type="text"
                placeholder="Search journal pieces by title or author..."
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <button
              onClick={() => setShowArticleModal(true)}
              className="glass-button px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Write Journal Piece</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(a => (
              <div key={a.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 border-white/60">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#8C857B] mb-1">
                    <span>{a.category}</span>
                    <span className="uppercase font-bold text-[#455240]">{a.language}</span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-[#1C1B1A] leading-snug">{a.title}</h4>
                  <p className="text-xs text-[#595550] mt-1 line-clamp-3">{a.excerpt}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D5] text-xs">
                  <span className="text-[#8C857B]">By {a.author}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete article "${a.title}"?`)) {
                        void deleteArticle(a.id);
                      }
                    }}
                    className="p-1 rounded text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 8: INSTAGRAM MEDIA LIBRARY --- */}
      {activeTab === 'instagram' && (
        <InstagramMediaLibrary />
      )}

      {/* --- TAB 9: INQUIRIES MANAGEMENT (ADMIN ONLY) --- */}
      {activeTab === 'enquiries' && adminRole === 'admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8C857B]" />
                <input
                  type="text"
                  placeholder="Search inquiries by name or email..."
                  value={enqSearch}
                  onChange={(e) => setEnqSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <select
                value={enqTypeFilter}
                onChange={(e) => setEnqTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl glass-input text-xs"
              >
                <option value="all">All Inquiry Types</option>
                <option value="contact">General Contact</option>
                <option value="volunteer">Volunteer Expressions</option>
                <option value="book_donation">Book Donations</option>
                <option value="collaboration">Collaborations</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredEnquiries.length === 0 ? (
              <div className="glass-card p-12 text-center text-xs text-[#8C857B] rounded-2xl">
                No inquiries matching the selected criteria.
              </div>
            ) : (
              filteredEnquiries.map(enq => (
                <div key={enq.id} className="glass-card p-5 rounded-2xl space-y-3 border-white/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-[#1C1B1A]">{enq.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#455240]/10 text-[#455240]">
                        {enq.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={enq.status}
                        onChange={(e) => void updateEnquiryStatus(enq.id, e.target.value as Enquiry['status'])}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold glass-input"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="resolved">Resolved</option>
                      </select>

                      <button
                        onClick={() => {
                          if (confirm(`Delete inquiry from ${enq.name}?`)) {
                            void deleteEnquiry(enq.id);
                          }
                        }}
                        className="p-1.5 rounded text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#595550] leading-relaxed bg-white/50 p-3 rounded-xl border border-[#E8E2D5]">
                    {enq.message}
                  </p>

                  <div className="text-[11px] text-[#8C857B] flex items-center justify-between pt-1">
                    <span>Email: <a href={`mailto:${enq.email}`} className="text-[#455240] font-medium hover:underline">{enq.email}</a> {enq.phone && `• Phone: ${enq.phone}`}</span>
                    <span>Received: {new Date(enq.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 10: USER & ROLE MANAGEMENT (ADMIN ONLY) --- */}
      {activeTab === 'users' && adminRole === 'admin' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-4 border-white/60">
            <h3 className="font-serif text-lg font-bold text-[#1C1B1A]">
              Team Members & Role-Based Permissions
            </h3>
            <p className="text-xs text-[#595550] leading-relaxed">
              Staff roles are governed by PostgreSQL Row-Level Security triggers. Only verified administrators can promote or adjust community staff designations.
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1C1B1A]/5 text-[#595550] border-b border-[#E8E2D5] font-semibold">
                  <tr>
                    <th className="p-3.5">Staff Email</th>
                    <th className="p-3.5">Designation</th>
                    <th className="p-3.5">System Role</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {staffProfiles.map(p => (
                    <tr key={p.id} className="hover:bg-white/40">
                      <td className="p-3.5 font-semibold text-[#1C1B1A]">{p.email}</td>
                      <td className="p-3.5 text-[#595550]">{p.designation || 'Staff Member'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.role === 'admin'
                            ? 'bg-[#455240] text-white'
                            : p.role === 'editor'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {p.role || 'Unassigned'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {p.email !== currentUserEmail && (
                          <button
                            onClick={() => {
                              const newRole = p.role === 'editor' ? null : 'editor';
                              if (confirm(`Change role of ${p.email} to ${newRole || 'unassigned'}?`)) {
                                void updateStaffProfile(p.id, { role: newRole });
                              }
                            }}
                            className="text-xs font-semibold text-[#455240] hover:underline cursor-pointer"
                          >
                            {p.role === 'editor' ? 'Revoke Access' : 'Assign Editor'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 11: STORAGE & BUCKETS --- */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl space-y-3 border-white/60">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-base text-[#1C1B1A]">roa-reels</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                  Private Bucket
                </span>
              </div>
              <p className="text-xs text-[#595550] leading-relaxed">
                Stores community video reels (up to 500MB). RLS permits streaming of published reels via exact path equality.
              </p>
              <div className="text-[11px] text-[#8C857B] pt-2 border-t border-[#E8E2D5]">
                Allowed MIME: video/mp4, video/webm, video/quicktime
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-3 border-white/60">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-base text-[#1C1B1A]">roa-gallery</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                  Public CDN
                </span>
              </div>
              <p className="text-xs text-[#595550] leading-relaxed">
                Original community photographs (up to 20MB). Delivered via Supabase Global CDN.
              </p>
              <div className="text-[11px] text-[#8C857B] pt-2 border-t border-[#E8E2D5]">
                Allowed MIME: image/webp, image/jpeg, image/png
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-3 border-white/60">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-base text-[#1C1B1A]">roa-thumbnails</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                  Public CDN
                </span>
              </div>
              <p className="text-xs text-[#595550] leading-relaxed">
                Fast-loading image and video poster thumbnails (up to 10MB).
              </p>
              <div className="text-[11px] text-[#8C857B] pt-2 border-t border-[#E8E2D5]">
                Allowed MIME: image/webp, image/jpeg, image/png
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: CREATE MEETUP --- */}
      {showMeetupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal max-w-2xl w-full p-6 sm:p-8 rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Schedule New Community Gathering
            </h3>

            <form onSubmit={handleCreateMeetup} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Meetup Title</label>
                  <input
                    type="text"
                    required
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="e.g. Chapter 15 — Reading Under the Banyan"
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Edition Tag</label>
                  <input
                    type="text"
                    value={mEdition}
                    onChange={(e) => setMEdition(e.target.value)}
                    placeholder="e.g. Chapter 15"
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Date String</label>
                  <input
                    type="text"
                    required
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Time Label</label>
                  <input
                    type="text"
                    required
                    value={mTime}
                    onChange={(e) => setMTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Venue Name</label>
                  <input
                    type="text"
                    required
                    value={mVenue}
                    onChange={(e) => setMVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Address / Landmark</label>
                  <input
                    type="text"
                    value={mAddress}
                    onChange={(e) => setMAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Registration Status</label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as Meetup['registrationStatus'])}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="open">Open (Accepting RSVPs)</option>
                    <option value="announced">Announced (Upcoming)</option>
                    <option value="closed">Closed (Fully Booked)</option>
                    <option value="past">Past Gathering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Capacity Limit</label>
                  <input
                    type="number"
                    value={mCapacity}
                    onChange={(e) => setMCapacity(e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Featured Image URL</label>
                  <input
                    type="text"
                    value={mImage}
                    onChange={(e) => setMImage(e.target.value)}
                    placeholder="/images/enhanced/community/meetup-card-1.webp"
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Custom RSVP / Form URL</label>
                  <input
                    type="text"
                    value={mRegUrl}
                    onChange={(e) => setMRegUrl(e.target.value)}
                    placeholder="https://forms.gle/readers-of-aurangabad"
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mIsUpcoming"
                  checked={mIsUpcoming}
                  onChange={(e) => setMIsUpcoming(e.target.checked)}
                  className="rounded text-[#455240] focus:ring-[#455240]"
                />
                <label htmlFor="mIsUpcoming" className="font-semibold text-[#1C1B1A] cursor-pointer">
                  Mark as Upcoming Meetup (displays prominently on home page)
                </label>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  placeholder="Gathering theme, reading rhythm, and instructions for readers..."
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setShowMeetupModal(false)}
                  className="glass-button-secondary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-button px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Meetup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CREATE ARTICLE --- */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal max-w-2xl w-full p-6 sm:p-8 rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Publish New Journal Piece
            </h3>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={aTitle}
                  onChange={(e) => setATitle(e.target.value)}
                  placeholder="e.g. The Architecture of Quietude in Aurangabad"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Author Name</label>
                  <input
                    type="text"
                    required
                    value={aAuthor}
                    onChange={(e) => setAAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Author Role / City Tag</label>
                  <input
                    type="text"
                    value={aRole}
                    onChange={(e) => setARole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Category</label>
                  <select
                    value={aCategory}
                    onChange={(e) => setACategory(e.target.value as JournalCategory)}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Language</label>
                  <select
                    value={aLang}
                    onChange={(e) => setALang(e.target.value as Language)}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="ur">Urdu (اردو)</option>
                    <option value="mr">Marathi (मराठी)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Estimated Reading Time (mins)</label>
                  <input
                    type="text"
                    value={aReadTime}
                    onChange={(e) => setAReadTime(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Cover Image Path / URL</label>
                  <input
                    type="text"
                    value={aCover}
                    onChange={(e) => setACover(e.target.value)}
                    placeholder="/images/enhanced/gallery/roa-019-2026-11-05.webp"
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Short Excerpt</label>
                <textarea
                  rows={2}
                  value={aExcerpt}
                  onChange={(e) => setAExcerpt(e.target.value)}
                  placeholder="One or two sentences summarizing the piece..."
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Full Article Content</label>
                <textarea
                  rows={6}
                  required
                  value={aContent}
                  onChange={(e) => setAContent(e.target.value)}
                  placeholder="Full essay or reflections..."
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="glass-button-secondary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-button px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Publish to Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD GALLERY ITEM --- */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal max-w-lg w-full p-6 rounded-3xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#1C1B1A]">Add Community Photograph</h3>
            <form onSubmit={handleCreateGallery} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={gTitle}
                  onChange={(e) => setGTitle(e.target.value)}
                  placeholder="e.g. Readers gathered under the trees"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Caption / Venue Details</label>
                <input
                  type="text"
                  value={gCaption}
                  onChange={(e) => setGCaption(e.target.value)}
                  placeholder="e.g. Siddharth Garden reading session"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Image URL or Local Web Path</label>
                <input
                  type="text"
                  required
                  value={gImageUrl}
                  onChange={(e) => setGImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D5]">
                <button type="button" onClick={() => setShowGalleryModal(false)} className="glass-button-secondary px-4 py-2 rounded-xl">Cancel</button>
                <button type="submit" className="glass-button px-4 py-2 rounded-xl">Save Photograph</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: CREATE ANNOUNCEMENT --- */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal max-w-lg w-full p-6 rounded-3xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#1C1B1A]">Publish Notice / Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Monsoon Reading Gathering Announced"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Notice Content</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Full announcement text..."
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Action URL (Optional)</label>
                <input
                  type="url"
                  value={annUrl}
                  onChange={(e) => setAnnUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D5]">
                <button type="button" onClick={() => setShowAnnModal(false)} className="glass-button-secondary px-4 py-2 rounded-xl">Cancel</button>
                <button type="submit" className="glass-button px-4 py-2 rounded-xl">Publish Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: UPLOAD REEL --- */}
      {showReelUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal max-w-lg w-full p-6 rounded-3xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#1C1B1A]">Upload Meetup Video Reel</h3>
            <form onSubmit={handleUploadReel} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Video File (.mp4, .webm)</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  required
                  onChange={handleReelFileChange}
                  className="w-full text-xs"
                />
              </div>

              {reelVideoPreviewUrl && (
                <div className="aspect-[9/16] max-h-60 rounded-xl overflow-hidden bg-black mx-auto">
                  <video src={reelVideoPreviewUrl} controls className="w-full h-full object-contain" />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Reel Title</label>
                <input
                  type="text"
                  required
                  value={reelTitle}
                  onChange={(e) => setReelTitle(e.target.value)}
                  placeholder="e.g. Readers of Aurangabad — Chapter 12 Highlights"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Caption</label>
                <textarea
                  rows={2}
                  value={reelCaption}
                  onChange={(e) => setReelCaption(e.target.value)}
                  placeholder="Short description..."
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>

              {isUploadingReel && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#455240] h-2 rounded-full transition-all duration-200" style={{ width: `${reelUploadProgress}%` }} />
                  </div>
                  <span className="text-[10px] text-[#8C857B] block text-right">{reelUploadProgress}% processing...</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D5]">
                <button type="button" onClick={() => { setShowReelUploadModal(false); resetReelUploadState(); }} className="glass-button-secondary px-4 py-2 rounded-xl">Cancel</button>
                <button type="submit" disabled={isUploadingReel} className="glass-button px-4 py-2 rounded-xl">
                  {isUploadingReel ? 'Processing...' : 'Upload Reel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
