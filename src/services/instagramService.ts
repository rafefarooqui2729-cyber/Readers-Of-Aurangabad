import type { InstagramMediaItem, InstagramAuthConfig, MediaCategory } from '../types';

export const INITIAL_INSTAGRAM_CONFIG: InstagramAuthConfig = {
  connected: false,
  username: 'readers.of.aurangabad',
  accountType: 'CREATOR',
  lastSyncedAt: undefined
};

// Auto-categorize Instagram post based on caption keywords
export const categorizeInstagramCaption = (caption: string): MediaCategory => {
  const text = caption.toLowerCase();
  if (text.includes('chapter') || text.includes('meetup') || text.includes('gathering')) {
    return 'Meetups';
  }
  if (text.includes('silent reading') || text.includes('reading hour') || text.includes('pages')) {
    return 'Reading Sessions';
  }
  if (text.includes('reel') || text.includes('video') || text.includes('audio')) {
    return 'Reels';
  }
  if (text.includes('announcement') || text.includes('upcoming') || text.includes('register') || text.includes('rsvp')) {
    return 'Announcements';
  }
  if (text.includes('highlights') || text.includes('recap') || text.includes('memories')) {
    return 'Event Highlights';
  }
  if (text.includes('bts') || text.includes('behind') || text.includes('setup')) {
    return 'Behind the Scenes';
  }
  if (text.includes('community') || text.includes('readers') || text.includes('friends') || text.includes('circle')) {
    return 'Community Moments';
  }
  return 'Other';
};

/**
 * Sample content for sync, frame-extraction, and publishing tests.
 * Engagement counts are intentionally omitted until real API data is connected.
 */
export const SAMPLE_INSTAGRAM_POSTS: InstagramMediaItem[] = [
  {
    id: 'ig-post-101',
    caption: 'Chapter 14 Sunday Morning Sanctuary under the trees of Aurangabad. Readers sat together in total silence with their favourite paperbacks. #ReadersOfAurangabad #ReadersOfMH20 #Aurangabad #ReadingMovement',
    mediaType: 'IMAGE',
    mediaUrl: '/images/enhanced/gallery/roa-009-2026-11-05.webp',
    thumbnailUrl: '/images/enhanced/thumbnails/roa-009-2026-11-05-thumb.webp',
    permalink: 'https://www.instagram.com/readers.of.aurangabad/',
    timestamp: '2026-10-25T08:30:00Z',
    category: 'Meetups',
    status: 'draft',
  },
  {
    id: 'ig-reel-102',
    caption: 'A quiet morning chapter at Siddharth Garden. Join us at our next gathering for paperbacks, conversation, and unhurried calm. #ReadersOfAurangabad #ReelsIndia #BookCommunity #Silence',
    mediaType: 'IMAGE',
    mediaUrl: '/images/enhanced/gallery/roa-060-2026-11-05.webp',
    thumbnailUrl: '/images/enhanced/thumbnails/roa-060-2026-11-05-thumb.webp',
    permalink: 'https://www.instagram.com/readers.of.aurangabad/',
    timestamp: '2026-10-20T10:15:00Z',
    category: 'Reels',
    status: 'published',
  },
  {
    id: 'ig-post-103',
    caption: 'Books across languages resting together on our reading mat: Marathi novels by V.P. Kale, Urdu poetry of Wali Dakhani, Hindi short stories of Premchand, and English classics. Literature knows no borders. #ReadersOfMH20',
    mediaType: 'IMAGE',
    mediaUrl: '/images/enhanced/gallery/roa-059-2026-11-05.webp',
    thumbnailUrl: '/images/enhanced/thumbnails/roa-059-2026-11-05-thumb.webp',
    permalink: 'https://www.instagram.com/readers.of.aurangabad/',
    timestamp: '2026-10-15T11:00:00Z',
    category: 'Reading Sessions',
    status: 'published',
  },
  {
    id: 'ig-reel-104',
    caption: 'The post-reading conversation circle. Readers share the single line that stayed with them today. #ReadersOfAurangabad #MH20 #ChhatrapatiSambhajinagar #Community',
    mediaType: 'IMAGE',
    mediaUrl: '/images/enhanced/gallery/roa-051-2026-11-05.webp',
    thumbnailUrl: '/images/enhanced/thumbnails/roa-051-2026-11-05-thumb.webp',
    permalink: 'https://www.instagram.com/readers.of.aurangabad/',
    timestamp: '2026-10-08T09:45:00Z',
    category: 'Community Moments',
    status: 'draft',
  },
  {
    id: 'ig-post-105',
    caption: 'Chapter 12 Monsoon Book Exchange. Books were donated and exchanged by generous readers across Aurangabad. #BookDonations #CommunityLibrary #ReadersOfAurangabad',
    mediaType: 'CAROUSEL_ALBUM',
    mediaUrl: '/images/enhanced/gallery/roa-019-2026-11-05.webp',
    thumbnailUrl: '/images/enhanced/thumbnails/roa-019-2026-11-05-thumb.webp',
    permalink: 'https://www.instagram.com/readers.of.aurangabad/',
    timestamp: '2026-09-28T14:20:00Z',
    category: 'Event Highlights',
    status: 'published',
  }
];
