export type Language = 'en' | 'hi' | 'ur' | 'mr';

export type PageRoute =
  | 'home'
  | 'story'
  | 'gatherings'
  | 'journal'
  | 'community'
  | 'get-involved'
  | 'contact'
  | 'admin';

export interface Meetup {
  id: string;
  title: string;
  edition?: string; // e.g. "Chapter 12", "Monsoon Session"
  date: string;
  time: string;
  venue: string;
  address?: string;
  description: string;
  featuredImage: string;
  registrationUrl: string; // Google Form link
  rsvpLink?: string;
  registrationStatus: 'open' | 'closed' | 'announced' | 'past';
  capacity?: string;
  activities: string[];
  schedule?: { time: string; activity: string }[];
  highlights?: string;
  photos?: string[];
  isUpcoming: boolean;
}

export type JournalCategory =
  | 'Reader Stories'
  | 'Personal Essays'
  | 'Book Reflections'
  | 'Literature & Culture'
  | 'Poetry'
  | 'Opinions'
  | 'Creative Writing'
  | 'Community Experiences';

export interface JournalArticle {
  id: string;
  title: string;
  slug: string;
  author: string;
  authorRole?: string;
  category: JournalCategory;
  publishedDate: string;
  readingTime: string;
  coverImage: string;
  excerpt: string;
  content: string;
  language: Language;
  tags: string[];
  featured?: boolean;
}

export interface ReaderStory {
  id: string;
  name: string;
  location?: string;
  favoriteBooks: string[];
  story: string;
  quote: string;
  avatar?: string;
  memberSince?: string;
}

export type EnquiryType = 'volunteer' | 'book_donation' | 'collaboration' | 'contact';

export interface Enquiry {
  id: string;
  type: EnquiryType;
  name: string;
  email: string;
  phone?: string;
  message: string;
  details?: Record<string, any>;
  createdAt: string;
  status: 'new' | 'contacted' | 'resolved';
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  meetupId?: string;
  date: string;
}

/* --- INSTAGRAM INTEGRATION & VIDEO EXTRACTION TYPES --- */

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

export type MediaCategory =
  | 'Meetups'
  | 'Reading Sessions'
  | 'Community Moments'
  | 'Reels'
  | 'Event Highlights'
  | 'Announcements'
  | 'Behind the Scenes'
  | 'Other';

export interface ExtractedFrame {
  id: string;
  sourceVideoId: string;
  timestampSeconds: number;
  formattedTimestamp: string;
  dataUrl: string; // Base64 data URL or blob
  width: number;
  height: number;
  savedToLibrary: boolean;
  format: 'image/jpeg' | 'image/webp';
}

export interface InstagramMediaItem {
  id: string;
  caption: string;
  mediaType: InstagramMediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  timestamp: string;
  category: MediaCategory;
  status: 'draft' | 'published';
  extractedFrames?: ExtractedFrame[];
  isCustomUpload?: boolean;
  aspectRatio?: string;
  likesCount?: number;
  commentsCount?: number;
}

export interface InstagramAuthConfig {
  connected: boolean;
  username: string;
  accountType: 'BUSINESS' | 'CREATOR' | 'PERSONAL';
  appId?: string;
  accessToken?: string; // Token placeholder managed securely
  tokenExpiry?: string;
  lastSyncedAt?: string;
}

/* --- REEL MANAGEMENT & SEQUENTIAL PLAYLIST TYPES --- */

export interface MeetupReel {
  id: string;
  title: string;
  caption?: string;
  videoUrl: string; // File path (e.g. /media/reels/meetup01.MP4) or blob URL
  posterUrl?: string;
  order: number;
  published: boolean;
  isPublished?: boolean;
  createdAt: string;
  durationSeconds?: number;
  isCustomUpload?: boolean;
}

export interface Registration {
  id: string;
  meetupId: string;
  meetupTitle?: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  consent: boolean;
  status: 'new' | 'contacted' | 'resolved';
  details?: Record<string, any>;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  actionUrl?: string;
  isPublished: boolean;
  publishedAt: string;
  expiresAt?: string;
  createdAt: string;
}

export interface StaffProfile {
  id: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'editor' | null;
  designation?: string;
  createdAt: string;
  updatedAt: string;
}
