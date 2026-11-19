export interface SiteConfig {
  name: string;
  wordmark: string;
  tagline: string;
  region: string;
  establishedYear: string;
  whatsappUrl: string;
  instagramHandle: string;
  instagramUrl: string;
  email: string;
  locationLine: string;
  hero: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    description: string;
    whatsappCtaText: string;
    nextMeetupCtaText: string;
    photoPlaceholderLabel: string;
  };
  footer: {
    codeOfConductUrl: string;
    copyrightText: string;
  };
}

export interface MeetupItem {
  id: string;
  slug: string;
  title: string;
  edition?: string;
  bookTitle?: string;
  bookAuthor?: string;
  date: string;
  time: string;
  venue: string;
  address?: string;
  mapUrl?: string;
  rsvpWhatsAppUrl?: string;
  photoUrl?: string;
  caption?: string;
  isUpcoming?: boolean;
  attendeeQuotes?: { quote: string; member: string }[];
  summary?: string;
}

export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  oneLineReason: string;
  suggestedBy?: string;
  isBookOfTheMonth?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  instagramUrl?: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  memberName: string;
  joinYear: string;
  location?: string;
}

export interface StatItem {
  id: string;
  value?: string | number;
  label: string;
  suffix?: string;
}
