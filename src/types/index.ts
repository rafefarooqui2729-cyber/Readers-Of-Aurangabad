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
  registrationStatus: 'open' | 'closed' | 'announced' | 'past';
  capacity?: string;
  activities: string[];
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
