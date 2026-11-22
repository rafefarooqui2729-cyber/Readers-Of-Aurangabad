import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { isStoragePath } from '../utils/galleryStorage';
import { isSafeExternalUrl, isSafeActionUrl, safeExternalHref } from '../utils/url';
import { isMeetupUpcoming } from '../utils/meetupStatus';
import { validateGalleryImageFile } from '../utils/galleryImageUtils';
import { validateReelVideoFile } from '../utils/reelStorage';
import { downloadCsvFile } from '../utils/csvUtils';
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

/**
 * Explicit allowlist for gallery image sources that may be rendered without
 * going through signed URL resolution.
 *
 * Allowed:
 * - Root-relative local assets (`/images/...`), but never protocol-relative paths.
 * - HTTPS URLs.
 * - Base64 image data URLs produced by the existing frame-extraction workflow.
 * - Blob URLs produced by the existing manual Instagram upload workflow.
 */
function isSafeGalleryImageSource(value: string | null | undefined): boolean {
  if (!value) return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  // Reject protocol-relative and backslash-smuggled URL forms.
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return false;

  // Root-relative local path.
  if (trimmed.startsWith('/')) {
    // eslint-disable-next-line no-control-regex -- Rejects control characters and backslashes in local redirect paths.
return !/[\\\u0000-\u001F\u007F]/.test(trimmed);
  }

  // External images must be HTTPS.
  if (/^https:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Existing extracted Instagram frames are base64 image data URLs.
  if (/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(trimmed)) {
    return true;
  }

  // Existing manual Instagram image uploads use session-scoped blob URLs.
  if (/^blob:/i.test(trimmed)) {
    try {
      return new URL(trimmed).protocol === 'blob:';
    } catch {
      return false;
    }
  }

  return false;
}

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
    updateMeetup,
    deleteMeetup,
    articles,
    addArticle,
    deleteArticle,
    gallery,
    uploadGalleryItem,
    deleteGalleryItem,
    getSignedGalleryUrl,
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
  const [mRegUrl, setMRegUrl] = useState('');
  const [mStatus, setMStatus] = useState<Meetup['registrationStatus']>('open');
  const [mCapacity, setMCapacity] = useState('40');
  const [mIsUpcoming, setMIsUpcoming] = useState(true);
  const [mIsPublished, setMIsPublished] = useState(true);

  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Gallery Upload State
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [gTitle, setGTitle] = useState('');
  const [gCaption, setGCaption] = useState('');
  const [gFile, setGFile] = useState<File | null>(null);
  const [gPreviewUrl, setGPreviewUrl] = useState('');
  const [gError, setGError] = useState('');
  const [gIsValidating, setGIsValidating] = useState(false);
  const [gIsUploading, setGIsUploading] = useState(false);
  const [signedGalleryUrls, setSignedGalleryUrls] = useState<Record<string, { imageUrl: string; thumbnailUrl: string }>>({});
  const galleryPreviewUrlRef = useRef('');
  const gallerySubmitInFlightRef = useRef(false);
  const gallerySelectionTokenRef = useRef(0);

  // Release the local preview object URL when the dashboard unmounts.
  useEffect(() => {
    return () => {
      if (galleryPreviewUrlRef.current) {
        URL.revokeObjectURL(galleryPreviewUrlRef.current);
        galleryPreviewUrlRef.current = '';
      }
    };
  }, []);

  // Resolve private Storage paths into temporary signed URLs for admin previews.
  // Local static paths and external HTTPS URLs are returned unchanged by the helper.
  useEffect(() => {
    let cancelled = false;

    const resolveGalleryUrls = async () => {
      const next: Record<string, { imageUrl: string; thumbnailUrl: string }> = {};

      await Promise.all(gallery.map(async (item) => {
        try {
          const imageUrl = await getSignedGalleryUrl(item.imageUrl, 'original');
          let thumbnailUrl = imageUrl;

          if (item.thumbnailUrl) {
            try {
              thumbnailUrl = await getSignedGalleryUrl(item.thumbnailUrl, 'thumbnail') || imageUrl;
            } catch (thumbnailError) {
              console.error(`Unable to resolve gallery thumbnail ${item.id}:`, thumbnailError);
            }
          }

          next[item.id] = { imageUrl, thumbnailUrl };
        } catch (error) {
          console.error(`Unable to resolve gallery image ${item.id}:`, error);
          next[item.id] = { imageUrl: '', thumbnailUrl: '' };
        }
      }));

      if (!cancelled) setSignedGalleryUrls(next);
    };

    void resolveGalleryUrls();
    return () => { cancelled = true; };
  }, [gallery, getSignedGalleryUrl]);

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
  const reelSelectionTokenRef = useRef(0);
  const reelPreviewUrlRef = useRef('');

  useEffect(() => {
    return () => {
      reelSelectionTokenRef.current += 1;
      if (reelPreviewUrlRef.current) {
        URL.revokeObjectURL(reelPreviewUrlRef.current);
        reelPreviewUrlRef.current = '';
      }
    };
  }, []);

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
      ? 'If an account exists for this email, password reset instructions have been sent.'
      : result.error || 'Unable to send password reset instructions.');
  };

  // Create Meetup
  const handleCreateMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;
    setAdminFeedback(null);

    // Fail closed on invalid/unsafe registration URLs rather than persisting
    // a value that would be rendered as a working link.
    const safeRegUrl = safeExternalHref(mRegUrl);
    if (mRegUrl.trim() && !safeRegUrl) {
      setAdminFeedback({
        type: 'error',
        message: 'Enter a valid http(s) registration URL, or leave the field blank.',
      });
      return;
    }

    try {
      await addMeetup({
        edition: mEdition.trim(),
        title: mTitle.trim(),
        date: mDate.trim(),
        time: mTime.trim(),
        venue: mVenue.trim(),
        address: mAddress.trim(),
        description: mDesc.trim(),
        featuredImage: mImage.trim(),
        registrationUrl: safeRegUrl ?? '',
        rsvpLink: safeRegUrl,
        capacity: mCapacity.trim() || undefined,
        activities: ['Silent Reading', 'Passage Discussion', 'Book Swap'],
        isUpcoming: mIsUpcoming,
        isPublished: mIsPublished,
        isCompleted: mStatus === 'past',
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
      setAdminFeedback({
        type: 'success',
        message: mIsPublished
          ? 'Meetup saved and published. Member notifications are generated automatically by the database for qualifying publish/change events.'
          : 'Meetup saved as draft. No member notification was generated.',
      });
    } catch (error) {
      setAdminFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save meetup.',
      });
    }
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

  /** Revoke the local preview URL and reset all gallery upload state. */
  const resetGalleryForm = () => {
    gallerySelectionTokenRef.current += 1;

    if (galleryPreviewUrlRef.current) {
      URL.revokeObjectURL(galleryPreviewUrlRef.current);
      galleryPreviewUrlRef.current = '';
    }

    setGFile(null);
    setGPreviewUrl('');
    setGTitle('');
    setGCaption('');
    setGError('');
    setGIsValidating(false);
    setGIsUploading(false);
    gallerySubmitInFlightRef.current = false;
  };

  const closeGalleryModal = () => {
    if (gIsUploading) return;
    setShowGalleryModal(false);
    resetGalleryForm();
  };

  // Validate the selected image locally and show an immediate preview.
  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    const selectionToken = gallerySelectionTokenRef.current + 1;
    gallerySelectionTokenRef.current = selectionToken;

    setGError('');
    setGFile(null);

    if (galleryPreviewUrlRef.current) {
      URL.revokeObjectURL(galleryPreviewUrlRef.current);
      galleryPreviewUrlRef.current = '';
    }
    setGPreviewUrl('');

    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    galleryPreviewUrlRef.current = objectUrl;
    setGPreviewUrl(objectUrl);
    setGIsValidating(true);

    const validation = await validateGalleryImageFile(file);

    // The modal was reset or a newer file selection superseded this request.
    if (gallerySelectionTokenRef.current !== selectionToken || input.files?.[0] !== file) return;

    setGIsValidating(false);

    if (!validation.valid) {
      setGError(validation.error || 'The selected file does not meet gallery requirements.');
      return;
    }

    setGFile(file);
  };

  // Upload through the existing context pipeline. Close/reset only on success.
  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (gallerySubmitInFlightRef.current) return;

    if (!gFile) {
      setGError('Please choose a JPEG, PNG or WebP image to upload.');
      return;
    }

    const title = gTitle.trim();
    if (!title) {
      setGError('Please enter a title for the photograph.');
      return;
    }

    gallerySubmitInFlightRef.current = true;
    setGIsUploading(true);
    setGError('');

    try {
      const result = await uploadGalleryItem(gFile, title, gCaption.trim());

      if (result.ok) {
        // Both Storage upload and database insert succeeded.
        setShowGalleryModal(false);
        resetGalleryForm();
        return;
      }

      setGError(result.error || 'The photograph could not be uploaded. Please try again.');
    } catch (error: any) {
      setGError(`Upload failed: ${error?.message || error}`);
    } finally {
      setGIsUploading(false);
      gallerySubmitInFlightRef.current = false;
    }
  };

  // Create Announcement
  const [annIsPublished, setAnnIsPublished] = useState(true);
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setAdminFeedback(null);

    if (annUrl.trim() && !isSafeActionUrl(annUrl)) {
      setAdminFeedback({
        type: 'error',
        message: 'Enter a valid http(s) URL or an internal page name, or leave the field blank.',
      });
      return;
    }

    const res = await addAnnouncement({
      title: annTitle.trim(),
      content: annContent.trim(),
      actionUrl: annUrl.trim() || undefined,
      isPublished: annIsPublished,
      publishedAt: new Date().toISOString()
    });

    if (!res.ok) {
      setAdminFeedback({ type: 'error', message: res.error || 'Failed to save announcement.' });
      return;
    }

    setShowAnnModal(false);
    setAnnTitle('');
    setAnnContent('');
    setAnnUrl('');
    setAdminFeedback({
      type: 'success',
      message: annIsPublished
        ? 'Announcement published. Member notifications will be generated for eligible published updates.'
        : 'Announcement saved as draft. No member notification was generated.',
    });
  };

  /** Clear the selected reel and revoke its preview URL. */
  const clearReelVideoSelection = () => {
    reelSelectionTokenRef.current += 1;

    if (reelPreviewUrlRef.current) {
      URL.revokeObjectURL(reelPreviewUrlRef.current);
      reelPreviewUrlRef.current = '';
    }

    setReelVideoFile(null);
    setReelVideoPreviewUrl('');
  };

  // Validate each selected file before creating its preview.
  const handleReelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allow the same file to be selected again after an invalid attempt.
    e.target.value = '';

    const selectionToken = ++reelSelectionTokenRef.current;

    if (reelPreviewUrlRef.current) {
      URL.revokeObjectURL(reelPreviewUrlRef.current);
      reelPreviewUrlRef.current = '';
    }

    setReelVideoFile(null);
    setReelVideoPreviewUrl('');

    const validation = await validateReelVideoFile(file);

    // Ignore an older validation if another selection/reset happened meanwhile.
    if (selectionToken !== reelSelectionTokenRef.current) return;

    if (!validation.valid) {
      alert(validation.error || 'Please select a valid MP4 or WebM video.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    reelPreviewUrlRef.current = objectUrl;
    setReelVideoFile(file);
    setReelVideoPreviewUrl(objectUrl);
  };

  /** Reset all reel upload state and invalidate pending file validation. */
  const resetReelUploadState = () => {
    clearReelVideoSelection();
    setReelTitle('');
    setReelCaption('');
    setReelUploadProgress(0);
    setIsUploadingReel(false);
  };

  // Upload new reel
  const handleUploadReel = async (e: React.FormEvent) => {
    e.preventDefault();

    const fileToUpload = reelVideoFile;
    const selectionToken = reelSelectionTokenRef.current;

    if (!fileToUpload) {
      alert('Please choose an MP4 or WebM video file to upload.');
      return;
    }

    if (!reelTitle.trim()) {
      alert('Please enter a title for the reel.');
      return;
    }

    // Revalidate immediately before any upload/progress work begins.
    const validation = await validateReelVideoFile(fileToUpload);

    if (
      selectionToken !== reelSelectionTokenRef.current ||
      reelVideoFile !== fileToUpload
    ) {
      return;
    }

    if (!validation.valid) {
      clearReelVideoSelection();
      alert(validation.error || 'Please select a valid MP4 or WebM video.');
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
      }, fileToUpload);

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

  // Export registrations CSV with formula-injection protection and automatic resource cleanup
  const handleExportRegistrationsCSV = () => {
    if (adminRole !== 'admin') {
      alert('Access restricted: Only administrators can export attendee registrations.');
      return;
    }
    if (registrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }
    const headers = ['ID', 'Meetup', 'Attendee Name', 'Email', 'Phone', 'Status', 'Date', 'Message'];
    const rows = registrations.map(r => [
      r.id,
      r.meetupTitle || r.meetupId,
      r.name,
      r.email,
      r.phone || '',
      r.status,
      new Date(r.createdAt).toLocaleDateString(),
      r.message || ''
    ]);
    const filename = `readers-of-aurangabad-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsvFile(filename, headers, rows);
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
      <div className="admin-shell rr-container min-h-[85vh] flex items-center justify-center py-16">
        <div className="rr-panel max-w-md w-full p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-[var(--rr-brass)]" />

          <div className="text-center space-y-3 mb-8">
            <div className="w-14 h-14 rr-panel--dark mx-auto flex items-center justify-center text-[var(--rr-brass)]">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="rr-title rr-title--compact">
              Staff Sign In
            </h1>
            <p className="rr-body text-xs text-center max-w-xs mx-auto">
              Authorized portal for Founders and Community Leads of Readers of Aurangabad.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="rr-label block mb-2">
                Staff Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@readersofaurangabad.com"
                className="rr-input text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="rr-label block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="rr-link text-[11px] font-medium"
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
                className="rr-input text-xs"
              />
            </div>

            {loginError && (
              <div className="rr-alert text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {resetMessage && (
              <div className="rr-alert rr-alert--success text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{resetMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={adminAuthLoading}
              className="rr-btn w-full mt-2"
            >
              {adminAuthLoading ? (
                <div className="w-4 h-4 border-2 border-[var(--rr-on-dark)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate to Portal</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--rr-border)] text-center">
            <span className="text-[11px] text-[var(--rr-muted)] block">
              Protected by PostgreSQL Row-Level Security & Role Anti-Tamper Engine
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render Authenticated Dashboard
  return (
    <div className="admin-shell rr-container py-12 space-y-10">

      {/* Top Identity & Header Banner */}
      <div className="rr-section-head">
        <div className="rr-section-head__copy space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="rr-meta px-2.5 py-1 bg-[var(--rr-forest)] text-[var(--rr-on-dark)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{adminRole === 'admin' ? 'Founder (Admin)' : 'Community Lead (Editor)'}</span>
            </span>

            {/* Supabase Database Connection Badge */}
            <span className={`rr-meta inline-flex items-center gap-1 px-2.5 py-0.5 border ${
              isDbConnected
                ? 'bg-[var(--rr-sage)] text-[var(--rr-forest)] border-[var(--rr-brass)]'
                : 'bg-[var(--rr-brass)]/20 text-[var(--rr-ink)] border-[var(--rr-brass)]'
            }`}>
              <Database className="w-3 h-3" />
              <span>{isDbConnected ? 'Supabase Live' : 'Local Fallback'}</span>
            </span>

            {currentUserDesignation && (
              <span className="rr-body text-xs italic font-serif">
                "{currentUserDesignation}"
              </span>
            )}
          </div>
          <h1 className="rr-title rr-title--compact">
            Administrative Portal
          </h1>
          <p className="rr-body text-xs">
            Signed in as <span className="font-semibold text-[var(--rr-ink)]">{currentUserEmail}</span>
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="rr-section-head__action flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void refreshData()}
            disabled={dbLoading}
            className="rr-btn rr-btn--outline"
            title="Refresh live data from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dbLoading ? 'animate-spin' : ''}`} />
            <span>Sync DB</span>
          </button>

          <button
            onClick={exportDataJson}
            className="rr-btn rr-btn--outline"
            title={adminRole === 'admin' ? 'Export full administrative JSON backup (includes registrations & enquiries)' : 'Export public content JSON backup (meetups, articles, gallery)'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{adminRole === 'admin' ? 'Backup JSON' : 'Backup Content'}</span>
          </button>

          <button
            onClick={async () => {
              const res = await logoutAdmin();
              if (res && !res.ok && res.error) {
                alert(res.error);
              }
            }}
            className="rr-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rr-filter-row overflow-x-auto border-b border-[var(--rr-border)]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`rr-touch transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'overview' ? 'rr-btn' : 'rr-btn--outline'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('meetups')}
          className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'meetups' ? 'rr-btn' : 'rr-btn--outline'
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
          className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'registrations'
              ? 'rr-btn'
              : adminRole !== 'admin'
                ? 'opacity-60 bg-[var(--rr-paper)] text-[var(--rr-muted)] cursor-not-allowed'
                : 'rr-btn--outline'
          }`}
        >
          {adminRole !== 'admin' ? <Lock className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          <span>{adminRole === 'admin' ? `Registrations (${registrations.length})` : 'Registrations'}</span>
          {newRegistrationsCount > 0 && adminRole === 'admin' && (
            <span className="w-4 h-4 bg-[var(--rr-terracotta)] text-[var(--rr-on-dark)] text-[10px] flex items-center justify-center">
              {newRegistrationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'gallery' ? 'rr-btn' : 'rr-btn--outline'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Gallery ({gallery.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'reels' ? 'rr-btn' : 'rr-btn--outline'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Reels ({reels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'announcements' ? 'rr-btn' : 'rr-btn--outline'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Announcements ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'articles' ? 'rr-btn' : 'rr-btn--outline'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Journal ({articles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('instagram')}
          className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'instagram' ? 'rr-btn' : 'rr-btn--outline'
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
          className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'enquiries'
              ? 'rr-btn'
              : adminRole !== 'admin'
                ? 'opacity-60 bg-[var(--rr-paper)] text-[var(--rr-muted)] cursor-not-allowed'
                : 'rr-btn--outline'
          }`}
        >
          {adminRole !== 'admin' ? <Lock className="w-3.5 h-3.5" /> : <Inbox className="w-3.5 h-3.5" />}
          <span>{adminRole === 'admin' ? `Inquiries (${enquiries.length})` : 'Inquiries'}</span>
          {newEnquiriesCount > 0 && adminRole === 'admin' && (
            <span className="w-4 h-4 bg-[var(--rr-terracotta)] text-[var(--rr-on-dark)] text-[10px] flex items-center justify-center">
              {newEnquiriesCount}
            </span>
          )}
        </button>

        {/* User Roles - Admin Only */}
        {adminRole === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'users' ? 'rr-btn' : 'rr-btn--outline'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff & Roles</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('media')}
          className={`rr-touch transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'media' ? 'rr-btn' : 'rr-btn--outline'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Storage</span>
        </button>
      </div>

      {/* --- TAB 1: OVERVIEW & STATS --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border border-[var(--rr-border)] bg-[var(--rr-border)]">
            <div className="rr-panel p-6">
              <span className="rr-meta text-[var(--rr-muted)] block">Total Gatherings</span>
              <span className="rr-title rr-title--small text-3xl text-[var(--rr-forest)] block mt-2">{meetups.length}</span>
              <span className="text-xs text-[var(--rr-ink)] block mt-1">
                {meetups.filter(m => isMeetupUpcoming(m)).length} upcoming scheduled
              </span>
            </div>

            <div className="rr-panel p-6">
              <span className="rr-meta text-[var(--rr-muted)] block">Registrations</span>
              <span className="rr-title rr-title--small text-3xl text-[var(--rr-forest)] block mt-2">
                {adminRole === 'admin' ? registrations.length : 'Protected (Admin)'}
              </span>
              <span className="text-xs text-[var(--rr-terracotta)] block mt-1">
                {adminRole === 'admin' ? `${newRegistrationsCount} new attendees` : 'Founder Access Only'}
              </span>
            </div>

            <div className="rr-panel p-6">
              <span className="rr-meta text-[var(--rr-muted)] block">Journal Articles</span>
              <span className="rr-title rr-title--small text-3xl text-[var(--rr-forest)] block mt-2">{articles.length}</span>
              <span className="text-xs text-[var(--rr-ink)] block mt-1">Published community writings</span>
            </div>

            <div className="rr-panel p-6">
              <span className="rr-meta text-[var(--rr-muted)] block">Meetup Reels</span>
              <span className="rr-title rr-title--small text-3xl text-[var(--rr-forest)] block mt-2">{reels.length}</span>
              <span className="text-xs text-[var(--rr-ink)] block mt-1">
                {reels.filter(r => r.published ?? r.isPublished).length} published
              </span>
            </div>
          </div>

          {/* Quick Shortcuts & Permissions Banner */}
          <div className="rr-panel p-6 sm:p-8 space-y-5">
            <h3 className="rr-title rr-title--small">
              System Operational Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-[var(--rr-border)] bg-[var(--rr-border)] text-xs">
              <div className="rr-panel p-5 space-y-2">
                <span className="rr-label block">Current Access Tier</span>
                <p className="text-[var(--rr-muted)] leading-relaxed">
                  {adminRole === 'admin'
                    ? 'Founder / Full Administrator: You have unrestricted access to manage meetups, gallery images, articles, video reels, attendee registration PII, contact enquiries, and staff roles.'
                    : 'Community Lead / Editor: You can publish and curate meetups, reels, gallery items, and articles. Attendee registrations and member inquiries are strictly protected and hidden.'}
                </p>
              </div>

              <div className="rr-panel p-5 space-y-2">
                <span className="rr-label block">Supabase Backend Link</span>
                <p className="text-[var(--rr-muted)] leading-relaxed">
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
          {adminFeedback && (
            <div className={`rr-alert text-xs ${adminFeedback.type === 'success' ? 'rr-alert--success' : ''}`}>
              {adminFeedback.message}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--rr-muted)]" />
              <input
                type="text"
                placeholder="Search meetups by title or venue..."
                value={meetupSearch}
                onChange={(e) => setMeetupSearch(e.target.value)}
                className="rr-input pl-9 text-xs"
              />
            </div>
            <button
              onClick={() => { setAdminFeedback(null); setShowMeetupModal(true); }}
              className="rr-btn self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Gathering</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetups.map(m => (
              <div key={m.id} className="rr-panel overflow-hidden flex flex-col justify-between">
                <div className="rr-image relative h-40">
                  <img src={m.featuredImage} alt={m.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    {m.edition && (
                      <span className="rr-meta px-2 py-1 bg-[var(--rr-terracotta)] text-[var(--rr-on-dark)]">
                        {m.edition}
                      </span>
                    )}
                    <span className="rr-meta px-2 py-1 bg-[var(--rr-ivory)] text-[var(--rr-ink)] border border-[var(--rr-border)]">
                      {m.registrationStatus}
                    </span>
                    <span className={`rr-meta px-2 py-1 border border-[var(--rr-border)] ${m.isPublished === false ? 'bg-[var(--rr-paper)] text-[var(--rr-muted)]' : 'bg-[var(--rr-sage)] text-[var(--rr-forest)]'}`}>
                      {m.isPublished === false ? 'Draft' : 'Published'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="rr-title rr-title--small leading-snug">{m.title}</h3>
                    <p className="rr-body text-xs mt-1 line-clamp-2">{m.description}</p>
                    <div className="mt-3 rr-body text-xs space-y-1">
                      <span className="block font-medium">{m.date} • {m.time}</span>
                      <span className="block">{m.venue}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[var(--rr-border)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--rr-ink)]">
                        Capacity: {m.capacity || 'Unlimited'}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete meetup "${m.title}"?`)) {
                            void deleteMeetup(m.id);
                          }
                        }}
                        className="p-2 rr-touch text-[var(--rr-terracotta)] border border-transparent hover:border-[var(--rr-border)] transition-colors"
                        title="Delete meetup"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setAdminFeedback(null);
                          try {
                            await updateMeetup(m.id, { isPublished: m.isPublished === false });
                            setAdminFeedback({
                              type: 'success',
                              message: m.isPublished === false
                                ? `Published "${m.title}". Notification generation is handled automatically for qualifying publish events.`
                                : `Saved "${m.title}" as draft.`,
                            });
                          } catch (error) {
                            setAdminFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update meetup.' });
                          }
                        }}
                        className="rr-btn rr-btn--outline text-[11px]"
                      >
                        {m.isPublished === false ? 'Publish' : 'Unpublish'}
                      </button>
                      {m.registrationStatus === 'cancelled' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            setAdminFeedback(null);
                            try {
                              await updateMeetup(m.id, { registrationStatus: 'open' });
                              setAdminFeedback({ type: 'success', message: `Reopened "${m.title}" as open.` });
                            } catch (error) {
                              setAdminFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update meetup.' });
                            }
                          }}
                          className="rr-btn rr-btn--outline text-[11px]"
                        >
                          Reopen
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Cancel "${m.title}"? This will generate a cancellation notification for members if eligible.`)) return;
                            setAdminFeedback(null);
                            try {
                              await updateMeetup(m.id, { registrationStatus: 'cancelled' });
                              setAdminFeedback({ type: 'success', message: `Cancelled "${m.title}". Cancellation notification generation is handled automatically.` });
                            } catch (error) {
                              setAdminFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to cancel meetup.' });
                            }
                          }}
                          className="rr-btn rr-btn--outline text-[11px] text-[var(--rr-terracotta)] border-[var(--rr-terracotta)]"
                        >
                          Cancel event
                        </button>
                      )}
                    </div>
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
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--rr-muted)]" />
                <input
                  type="text"
                  placeholder="Search attendee by name or email..."
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="rr-input pl-9 text-xs"
                />
              </div>

              <select
                value={regMeetupFilter}
                onChange={(e) => setRegMeetupFilter(e.target.value)}
                className="rr-input text-xs"
              >
                <option value="all">All Gatherings</option>
                {meetups.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportRegistrationsCSV}
              className="rr-btn self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="rr-panel overflow-hidden">
            {filteredRegistrations.length === 0 ? (
              <div className="rr-empty text-xs text-[var(--rr-muted)]">
                No attendee registrations recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="rr-table">
                  <thead className="border-b border-[var(--rr-border)]">
                    <tr>
                      <th className="p-3.5">Attendee</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Gathering</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rr-border)]">
                    {filteredRegistrations.map(r => (
                      <tr key={r.id} className="hover:bg-[var(--rr-paper)] transition-colors">
                        <td className="p-3.5 font-semibold text-[var(--rr-ink)]">
                          {r.name}
                          {r.message && (
                            <span className="block text-[11px] font-normal text-[var(--rr-muted)] italic line-clamp-1">
                              "{r.message}"
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="block">{r.email}</span>
                          {r.phone && <span className="block text-[11px] text-[var(--rr-muted)]">{r.phone}</span>}
                        </td>
                        <td className="p-3.5 text-[var(--rr-ink)] font-medium">
                          {r.meetupTitle || 'Community Gathering'}
                        </td>
                        <td className="p-3.5">
                          <select
                            value={r.status}
                            onChange={(e) => void updateRegistrationStatus(r.id, e.target.value as Registration['status'])}
                            className="rr-input text-xs min-h-0 py-1"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="resolved">Confirmed</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-[11px] text-[var(--rr-muted)]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Remove registration for ${r.name}?`)) {
                                void deleteRegistration(r.id);
                              }
                            }}
                            className="p-2 rr-touch text-[var(--rr-terracotta)] border border-transparent hover:border-[var(--rr-border)]"
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
            <h3 className="rr-title rr-title--small">
              Community Photography ({gallery.length})
            </h3>
            <button
              onClick={() => setShowGalleryModal(true)}
              className="rr-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add Photograph</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {gallery.map(item => {
              const resolved = signedGalleryUrls[item.id];
              const resolvedSrc = resolved?.thumbnailUrl || resolved?.imageUrl || '';
              const fallbackSrc = isSafeGalleryImageSource(item.imageUrl) ? item.imageUrl.trim() : '';
              const imageSrc = isSafeGalleryImageSource(resolvedSrc) ? resolvedSrc : fallbackSrc;

              return (
                <div key={item.id} className="rr-panel overflow-hidden group relative">
                  <div className="rr-image aspect-square flex items-center justify-center">
                    {imageSrc ? (
                      <img src={imageSrc} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="px-3 text-center text-[11px] text-[var(--rr-muted)]">
                        {isStoragePath(item.imageUrl) ? 'Secure preview unavailable' : 'No preview available'}
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--rr-ink)] truncate">{item.title}</span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete photograph "${item.title}"?`)) {
                          void deleteGalleryItem(item.id);
                        }
                      }}
                      className="p-2 rr-touch text-[var(--rr-terracotta)] border border-transparent hover:border-[var(--rr-border)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 5: REELS MANAGEMENT --- */}
      {activeTab === 'reels' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="rr-title rr-title--small">
              Sequential Meetup Reels ({reels.length})
            </h3>
            <button
              onClick={() => setShowReelUploadModal(true)}
              className="rr-btn"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Reel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reels.map((reel, idx) => (
              <div key={reel.id} className="rr-panel p-5 space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="rr-meta text-[var(--rr-terracotta)]">Reel #{reel.order}</span>
                  <button
                    onClick={() => void togglePublishReel(reel.id)}
                    className={`rr-meta px-2.5 py-1 border border-[var(--rr-border)] ${
                      reel.published ?? reel.isPublished
                        ? 'bg-[var(--rr-sage)] text-[var(--rr-forest)] border-[var(--rr-brass)]'
                        : 'bg-[var(--rr-paper)] text-[var(--rr-muted)]'
                    }`}
                  >
                    {reel.published ?? reel.isPublished ? 'Published' : 'Draft'}
                  </button>
                </div>

                <div>
                  <h4 className="rr-title rr-title--small text-base">{reel.title}</h4>
                  {reel.caption && <p className="rr-body text-xs mt-1 line-clamp-2">{reel.caption}</p>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--rr-border)]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveReel(idx, 'up')}
                      disabled={idx === 0}
                      className="p-2 rr-touch border border-[var(--rr-border)] hover:bg-[var(--rr-sage)] disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveReel(idx, 'down')}
                      disabled={idx === reels.length - 1}
                      className="p-2 rr-touch border border-[var(--rr-border)] hover:bg-[var(--rr-sage)] disabled:opacity-30"
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
                    className="p-2 rr-touch text-[var(--rr-terracotta)] border border-transparent hover:border-[var(--rr-border)]"
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
          {adminFeedback && (
            <div className={`rr-alert text-xs ${adminFeedback.type === 'success' ? 'rr-alert--success' : ''}`}>
              {adminFeedback.message}
            </div>
          )}
          <div className="flex items-center justify-between">
            <h3 className="rr-title rr-title--small">
              Live Notices & Announcements ({announcements.length})
            </h3>
            <button
              onClick={() => { setAdminFeedback(null); setShowAnnModal(true); }}
              className="rr-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Create Announcement</span>
            </button>
          </div>

          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="rr-empty text-xs text-[var(--rr-muted)]">
                No active announcements published yet.
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="rr-panel p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rr-title rr-title--small text-base">{ann.title}</span>
                      <span className={`rr-meta px-2 py-1 border border-[var(--rr-border)] ${ann.isPublished ? 'bg-[var(--rr-sage)] text-[var(--rr-forest)]' : 'bg-[var(--rr-paper)] text-[var(--rr-muted)]'}`}>
                        {ann.isPublished ? 'Active' : 'Draft'}
                      </span>
                    </div>
                    <p className="rr-body text-xs">{ann.content}</p>
                    {ann.actionUrl && isSafeExternalUrl(ann.actionUrl) ? (
                      <a href={ann.actionUrl} target="_blank" rel="noopener noreferrer" className="rr-link text-xs min-h-0 font-semibold mt-1">
                        Action Link: {ann.actionUrl}
                      </a>
                    ) : ann.actionUrl ? (
                      <span className="text-xs text-[var(--rr-ink)] font-semibold block mt-1">
                        Action page: {ann.actionUrl}
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete announcement "${ann.title}"?`)) {
                        void deleteAnnouncement(ann.id);
                      }
                    }}
                    className="p-2 rr-touch text-[var(--rr-terracotta)] border border-transparent hover:border-[var(--rr-border)]"
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
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--rr-muted)]" />
              <input
                type="text"
                placeholder="Search journal pieces by title or author..."
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                className="rr-input pl-9 text-xs"
              />
            </div>
            <button
              onClick={() => setShowArticleModal(true)}
              className="rr-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Write Journal Piece</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(a => (
              <div key={a.id} className="rr-panel p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--rr-muted)] mb-1">
                    <span>{a.category}</span>
                    <span className="uppercase font-bold text-[var(--rr-forest)]">{a.language}</span>
                  </div>
                  <h4 className="rr-title rr-title--small leading-snug">{a.title}</h4>
                  <p className="rr-body text-xs mt-1 line-clamp-3">{a.excerpt}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--rr-border)] text-xs">
                  <span className="text-[var(--rr-muted)]">By {a.author}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete article "${a.title}"?`)) {
                        void deleteArticle(a.id);
                      }
                    }}
                    className="p-2 rr-touch text-[var(--rr-terracotta)] border border-transparent hover:border-[var(--rr-border)]"
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
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--rr-muted)]" />
                <input
                  type="text"
                  placeholder="Search inquiries by name or email..."
                  value={enqSearch}
                  onChange={(e) => setEnqSearch(e.target.value)}
                  className="rr-input pl-9 text-xs"
                />
              </div>

              <select
                value={enqTypeFilter}
                onChange={(e) => setEnqTypeFilter(e.target.value)}
                className="rr-input text-xs"
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
              <div className="rr-empty text-xs text-[var(--rr-muted)]">
                No inquiries matching the selected criteria.
              </div>
            ) : (
              filteredEnquiries.map(enq => (
                <div key={enq.id} className="rr-panel p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rr-title rr-title--small text-base">{enq.name}</span>
                      <span className="rr-meta px-2 py-1 bg-[var(--rr-sage)] text-[var(--rr-forest)] border border-[var(--rr-brass)]">
                        {enq.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={enq.status}
                        onChange={(e) => void updateEnquiryStatus(enq.id, e.target.value as Enquiry['status'])}
                        className="rr-input text-xs min-h-0 py-1"
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
                        className="p-2 rr-touch text-[var(--rr-terracotta)] border border-transparent hover:border-[var(--rr-border)]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="rr-body text-xs bg-[var(--rr-ivory)] p-3 border border-[var(--rr-border)]">
                    {enq.message}
                  </p>

                  <div className="text-[11px] text-[var(--rr-muted)] flex items-center justify-between pt-1">
                    <span>Email: <a href={`mailto:${enq.email}`} className="text-[var(--rr-forest)] font-medium underline underline-offset-2">{enq.email}</a> {enq.phone && `• Phone: ${enq.phone}`}</span>
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
          <div className="rr-panel p-6 space-y-5">
            <h3 className="rr-title rr-title--small">
              Team Members & Role-Based Permissions
            </h3>
            <p className="rr-body text-xs">
              Staff roles are governed by PostgreSQL Row-Level Security triggers. Only verified administrators can promote or adjust community staff designations.
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="rr-table">
                <thead className="border-b border-[var(--rr-border)]">
                  <tr>
                    <th className="p-3.5">Staff Email</th>
                    <th className="p-3.5">Designation</th>
                    <th className="p-3.5">System Role</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rr-border)]">
                  {staffProfiles.map(p => (
                    <tr key={p.id} className="hover:bg-[var(--rr-paper)]">
                      <td className="p-3.5 font-semibold text-[var(--rr-ink)]">{p.email}</td>
                      <td className="p-3.5 text-[var(--rr-muted)]">{p.designation || 'Staff Member'}</td>
                      <td className="p-3.5">
                        <span className={`rr-meta px-2 py-1 border border-[var(--rr-border)] ${
                          p.role === 'admin'
                            ? 'bg-[var(--rr-forest)] text-[var(--rr-on-dark)] border-[var(--rr-forest)]'
                            : p.role === 'editor'
                              ? 'bg-[var(--rr-brass)]/25 text-[var(--rr-ink)] border-[var(--rr-brass)]'
                              : 'bg-[var(--rr-paper)] text-[var(--rr-muted)]'
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
                            className="rr-meta text-[var(--rr-ink)] hover:underline cursor-pointer"
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
            <div className="rr-panel p-6 space-y-3 border-[var(--rr-border)]">
              <div className="flex items-center justify-between">
                <span className="rr-title rr-title--small text-base">roa-reels</span>
                <span className="rr-meta px-2 py-1 bg-[var(--rr-brass)]/20 text-[var(--rr-ink)] border border-[var(--rr-brass)]">
                  Private Bucket
                </span>
              </div>
              <p className="rr-body text-xs">
                Stores community video reels (up to 100 MB). RLS permits streaming of published reels via exact path equality.
              </p>
              <div className="text-[11px] text-[var(--rr-muted)] pt-2 border-t border-[var(--rr-border)]">
                Allowed MIME: video/mp4, video/webm, video/quicktime
              </div>
            </div>

            <div className="rr-panel p-6 space-y-3 border-[var(--rr-border)]">
              <div className="flex items-center justify-between">
                <span className="rr-title rr-title--small text-base">roa-gallery</span>
                <span className="rr-meta px-2 py-1 bg-[var(--rr-sage)] text-[var(--rr-forest)] border border-[var(--rr-brass)]">
                  Public CDN
                </span>
              </div>
              <p className="rr-body text-xs">
                Original community photographs (up to 20MB). Delivered via Supabase Global CDN.
              </p>
              <div className="text-[11px] text-[var(--rr-muted)] pt-2 border-t border-[var(--rr-border)]">
                Allowed MIME: image/webp, image/jpeg, image/png
              </div>
            </div>

            <div className="rr-panel p-6 space-y-3 border-[var(--rr-border)]">
              <div className="flex items-center justify-between">
                <span className="rr-title rr-title--small text-base">roa-thumbnails</span>
                <span className="rr-meta px-2 py-1 bg-[var(--rr-sage)] text-[var(--rr-forest)] border border-[var(--rr-brass)]">
                  Public CDN
                </span>
              </div>
              <p className="rr-body text-xs">
                Fast-loading image and video poster thumbnails (up to 10MB).
              </p>
              <div className="text-[11px] text-[var(--rr-muted)] pt-2 border-t border-[var(--rr-border)]">
                Allowed MIME: image/webp, image/jpeg, image/png
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: CREATE MEETUP --- */}
      {showMeetupModal && (
        <div className="fixed inset-0 z-50 bg-[var(--rr-dark)]/80 flex items-center justify-center p-4">
          <div className="rr-panel max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <h3 className="rr-title rr-title--small">
              Schedule New Community Gathering
            </h3>

            <form onSubmit={handleCreateMeetup} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="rr-label block mb-2">Meetup Title</label>
                  <input
                    type="text"
                    required
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="e.g. Chapter 15 — Reading Under the Banyan"
                    className="rr-input"
                  />
                </div>
                <div>
                  <label className="rr-label block mb-2">Edition Tag</label>
                  <input
                    type="text"
                    value={mEdition}
                    onChange={(e) => setMEdition(e.target.value)}
                    placeholder="e.g. Chapter 15"
                    className="rr-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rr-label block mb-2">Date String</label>
                  <input
                    type="text"
                    required
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="rr-input"
                  />
                </div>
                <div>
                  <label className="rr-label block mb-2">Time Label</label>
                  <input
                    type="text"
                    required
                    value={mTime}
                    onChange={(e) => setMTime(e.target.value)}
                    className="rr-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rr-label block mb-2">Venue Name</label>
                  <input
                    type="text"
                    required
                    value={mVenue}
                    onChange={(e) => setMVenue(e.target.value)}
                    className="rr-input"
                  />
                </div>
                <div>
                  <label className="rr-label block mb-2">Address / Landmark</label>
                  <input
                    type="text"
                    value={mAddress}
                    onChange={(e) => setMAddress(e.target.value)}
                    className="rr-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rr-label block mb-2">Registration Status</label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as Meetup['registrationStatus'])}
                    className="rr-input"
                  >
                    <option value="open">Open (Accepting RSVPs)</option>
                    <option value="announced">Announced (Upcoming)</option>
                    <option value="closed">Closed (Fully Booked)</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="past">Past Gathering</option>
                  </select>
                </div>
                <div>
                  <label className="rr-label block mb-2">Capacity Limit</label>
                  <input
                    type="number"
                    value={mCapacity}
                    onChange={(e) => setMCapacity(e.target.value)}
                    placeholder="e.g. 40"
                    className="rr-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rr-label block mb-2">Featured Image URL</label>
                  <input
                    type="text"
                    value={mImage}
                    onChange={(e) => setMImage(e.target.value)}
                    placeholder="/images/enhanced/community/meetup-card-1.webp"
                    className="rr-input"
                  />
                </div>
                <div>
                  <label className="rr-label block mb-2">Custom RSVP / Form URL</label>
                  <input
                    type="url"
                    value={mRegUrl}
                    onChange={(e) => setMRegUrl(e.target.value)}
                    placeholder="https://… (optional — leave blank if not confirmed)"
                    className="rr-input"
                  />
                  <p className="mt-1 text-[11px] text-[var(--rr-muted)]">
                    Only a confirmed http(s) link is shown as a registration destination. Leave blank to ask readers to contact us instead.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mIsPublished"
                    checked={mIsPublished}
                    onChange={(e) => setMIsPublished(e.target.checked)}
                    className="accent-[var(--rr-forest)]"
                  />
                  <label htmlFor="mIsPublished" className="font-medium text-[var(--rr-ink)] cursor-pointer">
                    Publish meetup (visible to public and eligible for member notifications)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mIsUpcoming"
                    checked={mIsUpcoming}
                    onChange={(e) => setMIsUpcoming(e.target.checked)}
                    className="accent-[var(--rr-forest)]"
                  />
                  <label htmlFor="mIsUpcoming" className="font-medium text-[var(--rr-ink)] cursor-pointer">
                    Mark as upcoming highlight (derived automatically from date, publish, and cancellation state)
                  </label>
                </div>
              </div>

              <div>
                <label className="rr-label block mb-2">Description</label>
                <textarea
                  rows={3}
                  required
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  placeholder="Gathering theme, reading rhythm, and instructions for readers..."
                  className="rr-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--rr-border)]">
                <button
                  type="button"
                  onClick={() => setShowMeetupModal(false)}
                  className="rr-btn rr-btn--outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rr-btn"
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
        <div className="fixed inset-0 z-50 bg-[var(--rr-dark)]/80 flex items-center justify-center p-4">
          <div className="rr-panel max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <h3 className="rr-title rr-title--small">
              Publish New Journal Piece
            </h3>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div>
                <label className="rr-label block mb-2">Article Title</label>
                <input
                  type="text"
                  required
                  value={aTitle}
                  onChange={(e) => setATitle(e.target.value)}
                  placeholder="e.g. The Architecture of Quietude in Aurangabad"
                  className="rr-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rr-label block mb-2">Author Name</label>
                  <input
                    type="text"
                    required
                    value={aAuthor}
                    onChange={(e) => setAAuthor(e.target.value)}
                    className="rr-input"
                  />
                </div>
                <div>
                  <label className="rr-label block mb-2">Author Role / City Tag</label>
                  <input
                    type="text"
                    value={aRole}
                    onChange={(e) => setARole(e.target.value)}
                    className="rr-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rr-label block mb-2">Category</label>
                  <select
                    value={aCategory}
                    onChange={(e) => setACategory(e.target.value as JournalCategory)}
                    className="rr-input"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="rr-label block mb-2">Language</label>
                  <select
                    value={aLang}
                    onChange={(e) => setALang(e.target.value as Language)}
                    className="rr-input"
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
                  <label className="rr-label block mb-2">Estimated Reading Time (mins)</label>
                  <input
                    type="text"
                    value={aReadTime}
                    onChange={(e) => setAReadTime(e.target.value)}
                    placeholder="5"
                    className="rr-input"
                  />
                </div>
                <div>
                  <label className="rr-label block mb-2">Cover Image Path / URL</label>
                  <input
                    type="text"
                    value={aCover}
                    onChange={(e) => setACover(e.target.value)}
                    placeholder="/images/enhanced/gallery/roa-019-2026-11-05.webp"
                    className="rr-input"
                  />
                </div>
              </div>

              <div>
                <label className="rr-label block mb-2">Short Excerpt</label>
                <textarea
                  rows={2}
                  value={aExcerpt}
                  onChange={(e) => setAExcerpt(e.target.value)}
                  placeholder="One or two sentences summarizing the piece..."
                  className="rr-input"
                />
              </div>

              <div>
                <label className="rr-label block mb-2">Full Article Content</label>
                <textarea
                  rows={6}
                  required
                  value={aContent}
                  onChange={(e) => setAContent(e.target.value)}
                  placeholder="Full essay or reflections..."
                  className="rr-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--rr-border)]">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="rr-btn rr-btn--outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rr-btn"
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
        <div className="fixed inset-0 z-50 bg-[var(--rr-dark)]/80 flex items-center justify-center p-4">
          <div className="rr-panel max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="rr-title rr-title--small">Add Community Photograph</h3>
              <p className="mt-1 text-[11px] text-[var(--rr-muted)] leading-relaxed">
                Upload a JPEG, PNG or WebP image. The original and an optimized thumbnail are stored privately.
              </p>
            </div>

            <form onSubmit={handleCreateGallery} className="space-y-4 text-xs" aria-busy={gIsUploading}>
              <div>
                <label htmlFor="gallery-image-file" className="rr-label block">
                  Image File
                </label>
                <input
                  id="gallery-image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => void handleGalleryFileChange(e)}
                  disabled={gIsUploading || gIsValidating}
                  className="w-full text-xs file:mr-3 file:border-0 file:bg-[var(--rr-forest)] file:px-3 file:py-2 file:text-[var(--rr-on-dark)] file:text-xs file:font-semibold hover:file:bg-[var(--rr-terracotta)] disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <p className="mt-1.5 text-[11px] text-[var(--rr-muted)]">
                  JPEG, PNG or WebP · maximum 20 MB · one image per upload
                </p>
              </div>

              {gPreviewUrl && (
                <div className="rr-image overflow-hidden border border-[var(--rr-border)]">
                  <img
                    src={gPreviewUrl}
                    alt="Selected photograph preview"
                    className="w-full max-h-64 object-contain mx-auto"
                  />
                </div>
              )}

              {gFile && (
                <p className="text-[11px] text-[var(--rr-ink)] break-all">
                  <span className="font-semibold">{gFile.name}</span>
                  <span className="text-[var(--rr-muted)]"> · {(gFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                </p>
              )}

              {gIsValidating && (
                <div className="rr-alert flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-[var(--rr-forest)] border-t-transparent rounded-full animate-spin" />
                  <span>Validating image…</span>
                </div>
              )}

              {gError && (
                <div role="alert" className="rr-alert flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{gError}</span>
                </div>
              )}

              <div>
                <label className="rr-label block">Title</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={gTitle}
                  onChange={(e) => setGTitle(e.target.value)}
                  placeholder="e.g. Readers gathered under the trees"
                  disabled={gIsUploading}
                  className="rr-input disabled:opacity-60"
                />
              </div>

              <div>
                <label className="rr-label block">Caption / Venue Details (Optional)</label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={gCaption}
                  onChange={(e) => setGCaption(e.target.value)}
                  placeholder="e.g. Siddharth Garden reading session"
                  disabled={gIsUploading}
                  className="rr-input disabled:opacity-60"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--rr-border)]">
                <button
                  type="button"
                  onClick={closeGalleryModal}
                  disabled={gIsUploading}
                  className="rr-btn rr-btn--outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gIsUploading || gIsValidating}
                  className="rr-btn disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {gIsUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[var(--rr-on-dark)] border-t-transparent rounded-full animate-spin" />
                      <span>Uploading…</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Photograph</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: CREATE ANNOUNCEMENT --- */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 bg-[var(--rr-dark)]/80 flex items-center justify-center p-4">
          <div className="rr-panel max-w-lg w-full p-6 space-y-5">
            <h3 className="rr-title rr-title--small">Publish Notice / Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="rr-label block">Headline</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Monsoon Reading Gathering Announced"
                  className="rr-input"
                />
              </div>
              <div>
                <label className="rr-label block">Notice Content</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Full announcement text..."
                  className="rr-input"
                />
              </div>
              <div>
                <label className="rr-label block">Action URL (Optional)</label>
                <input
                  type="url"
                  value={annUrl}
                  onChange={(e) => setAnnUrl(e.target.value)}
                  placeholder="https://..."
                  className="rr-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="annIsPublishedModal"
                  checked={annIsPublished}
                  onChange={(e) => setAnnIsPublished(e.target.checked)}
                  className="accent-[var(--rr-forest)]"
                />
                <label htmlFor="annIsPublishedModal" className="font-medium text-[var(--rr-ink)] cursor-pointer">
                  Publish now (eligible for automatic member notification on publish)
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--rr-border)]">
                <button type="button" onClick={() => setShowAnnModal(false)} className="rr-btn rr-btn--outline">Cancel</button>
                <button type="submit" className="rr-btn">{annIsPublished ? 'Publish Announcement' : 'Save Draft'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: UPLOAD REEL --- */}
      {showReelUploadModal && (
        <div className="fixed inset-0 z-50 bg-[var(--rr-dark)]/80 flex items-center justify-center p-4">
          <div className="rr-panel max-w-lg w-full p-6 space-y-5">
            <h3 className="rr-title rr-title--small">Upload Meetup Video Reel</h3>
            <form onSubmit={handleUploadReel} className="space-y-4 text-xs">
              <div>
                <label className="rr-label block">Select Video File (.mp4, .webm)</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  required
                  onChange={handleReelFileChange}
                  className="w-full text-xs"
                />
              </div>

              {reelVideoPreviewUrl && (
                <div className="rr-image aspect-[9/16] max-h-60 mx-auto">
                  <video src={reelVideoPreviewUrl} controls className="w-full h-full object-contain" />
                </div>
              )}

              <div>
                <label className="rr-label block">Reel Title</label>
                <input
                  type="text"
                  required
                  value={reelTitle}
                  onChange={(e) => setReelTitle(e.target.value)}
                  placeholder="e.g. Readers of Aurangabad — Chapter 12 Highlights"
                  className="rr-input"
                />
              </div>

              <div>
                <label className="rr-label block">Caption</label>
                <textarea
                  rows={2}
                  value={reelCaption}
                  onChange={(e) => setReelCaption(e.target.value)}
                  placeholder="Short description..."
                  className="rr-input"
                />
              </div>

              {isUploadingReel && (
                <div className="space-y-1">
                  <div className="w-full bg-[var(--rr-border)] h-1">
                    <div className="bg-[var(--rr-forest)] h-1 transition-all duration-200" style={{ width: `${reelUploadProgress}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--rr-muted)] block text-right">{reelUploadProgress}% processing...</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--rr-border)]">
                <button type="button" onClick={() => { setShowReelUploadModal(false); resetReelUploadState(); }} className="rr-btn rr-btn--outline">Cancel</button>
                <button type="submit" disabled={isUploadingReel} className="rr-btn">
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
