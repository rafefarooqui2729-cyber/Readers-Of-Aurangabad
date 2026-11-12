import type { InstagramMediaItem, InstagramAuthConfig, MediaCategory } from '../types';

/**
 * Meta Instagram Graph API Endpoint
 * For Creator / Business Instagram accounts:
 * https://graph.facebook.com/v21.0/{user_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp
 */

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
 * Pre-seeded authentic Instagram content from @readers.of.aurangabad
 * Used to test syncing, frame extraction from reels, and publishing immediately.
 */
export const SAMPLE_INSTAGRAM_POSTS: InstagramMediaItem[] = [
  {
    id: 'ig-post-101',
    caption: 'Chapter 14 Sunday Morning Sanctuary under the trees of Aurangabad. When 35 strangers sit together in total silence with their favourite paperbacks, magic happens. #ReadersOfAurangabad #ReadersOfMH20 #Aurangabad #ReadingMovement',
    mediaType: 'IMAGE',
    mediaUrl: '/images/enhanced/gallery/roa-009-2026-11-05.webp',
    thumbnailUrl: '/images/enhanced/thumbnails/roa-009-2026-11-05-thumb.webp',
    permalink: 'https://www.instagram.com/readers.of.aurangabad/',
    timestamp: '2026-10-25T08:30:00Z',
    category: 'Meetups',
    status: 'draft',
    likesCount: 142,
    commentsCount: 18
  },
  {
    id: 'ig-reel-102',
    caption: 'A quiet morning chapter at Siddharth Garden. Join us next Sunday for paperbacks, conversation, and unhurried calm. #ReadersOfAurangabad #ReelsIndia #BookCommunity #Silence #SundayMorning',
    mediaType: 'IMAGE',
    mediaUrl: '/images/enhanced/gallery/roa-060-2026-11-05.webp',
    thumbnailUrl: '/images/enhanced/thumbnails/roa-060-2026-11-05-thumb.webp',
    permalink: 'https://www.instagram.com/readers.of.aurangabad/',
    timestamp: '2026-10-20T10:15:00Z',
    category: 'Reels',
    status: 'published',
    likesCount: 389,
    commentsCount: 42
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
    likesCount: 215,
    commentsCount: 27
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
    likesCount: 472,
    commentsCount: 38
  },
  {
    id: 'ig-post-105',
    caption: 'Chapter 12 Monsoon Book Exchange. Over 40 books donated and exchanged by generous readers across Aurangabad. #BookDonations #CommunityLibrary #ReadersOfAurangabad',
    mediaType: 'CAROUSEL_ALBUM',
    mediaUrl: '/images/enhanced/gallery/roa-019-2026-11-05.webp',
    thumbnailUrl: '/images/enhanced/thumbnails/roa-019-2026-11-05-thumb.webp',
    permalink: 'https://www.instagram.com/readers.of.aurangabad/',
    timestamp: '2026-09-28T14:20:00Z',
    category: 'Event Highlights',
    status: 'published',
    likesCount: 198,
    commentsCount: 15
  }
];

/**
 * Fetch Instagram Media from Official Meta Graph API
 */
export async function fetchFromInstagramGraphAPI(
  accessToken: string,
  userId: string = 'me'
): Promise<InstagramMediaItem[]> {
  try {
    const url = `https://graph.facebook.com/v21.0/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || `Instagram API error: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.data) return [];

    return data.data.map((item: any) => ({
      id: item.id,
      caption: item.caption || '',
      mediaType: item.media_type as InstagramMediaItem['mediaType'],
      mediaUrl: item.media_url || item.thumbnail_url,
      thumbnailUrl: item.thumbnail_url || item.media_url,
      permalink: item.permalink || 'https://www.instagram.com/readers.of.aurangabad/',
      timestamp: item.timestamp,
      category: categorizeInstagramCaption(item.caption || ''),
      status: 'draft', // All imported items default to draft until approved
      likesCount: item.like_count,
      commentsCount: item.comments_count
    }));
  } catch (err: any) {
    console.error('Instagram fetch error:', err);
    throw err;
  }
}
