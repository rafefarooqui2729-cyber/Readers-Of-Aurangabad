import type { Meetup, JournalArticle, ReaderStory, GalleryItem, MeetupReel } from '../types';
import { SITE_IMAGES, TRANSFORMED_COMMUNITY_GALLERY } from './imageMapping';

export const initialMeetups: Meetup[] = [
  {
    id: 'meetup-upcoming-1',
    title: 'The Sunday Open Chapter: Silence, Sunlight & Stories',
    edition: 'Chapter 14',
    date: 'Sunday, November 15, 2026',
    time: '8:30 AM – 11:00 AM IST',
    venue: 'Siddharth Garden / Historic Grounds',
    address: 'Near Central Bus Stand, Aurangabad, Maharashtra',
    description: 'Bring a book of your choice—fiction, non-fiction, poetry, or regional literature in any language. We begin with 60 minutes of silent reading under the morning shade, followed by coffee and voluntary reflections.',
    featuredImage: SITE_IMAGES.meetups.ch14Banner,
    // No verified public registration URL exists in project records. Do not
    // display a form link until an administrator supplies a confirmed URL.
    registrationUrl: '',
    registrationStatus: 'past',
    capacity: 'Open to all readers',
    activities: [
      '60 Minutes Silent Reading',
      'Informal Reader Introductions',
      'Book Recommendations & Swap',
      'Open Conversation on Literature & Life'
    ],
    highlights: 'Please carry a personal reading mat or towel, a water bottle, and the book you are currently reading.',
    photos: [
      '/images/enhanced/gallery/roa-009-2026-11-05.webp',
      '/images/enhanced/gallery/roa-060-2026-11-05.webp',
      '/images/enhanced/gallery/roa-061-2026-11-05.webp'
    ],
    isUpcoming: false,
  },
  {
    id: 'meetup-past-13',
    title: 'Autumn Pages: Poetry & Prose of the Deccan',
    edition: 'Chapter 13',
    date: 'Sunday, October 18, 2026',
    time: '9:00 AM – 11:30 AM IST',
    venue: 'University Campus Lawns',
    address: 'Dr. Babasaheb Ambedkar Marathwada University Grounds, Aurangabad',
    description: 'An intimate gathering where 28 readers assembled with paperbacks across Marathi, Urdu, Hindi, and English. We explored the quiet joy of reading without social media interruptions.',
    featuredImage: SITE_IMAGES.meetups.ch13Banner,
    registrationUrl: '',
    registrationStatus: 'past',
    activities: [
      'Silent Reading Hour',
      'Dakhani & Marathi Poetry Recitation',
      'Book Lending Circle'
    ],
    highlights: 'Members brought classic Marathi novels by V.P. Kale, Urdu poetry by Wali Dakhani, and contemporary global translations.',
    photos: [
      '/images/enhanced/gallery/roa-006-2026-11-05.webp',
      '/images/enhanced/gallery/roa-049-2026-11-05.webp',
      '/images/enhanced/gallery/roa-058-2026-11-05.webp'
    ],
    isUpcoming: false,
  },
  {
    id: 'meetup-past-12',
    title: 'The Monsoon Book Exchange',
    edition: 'Chapter 12',
    date: 'Saturday, August 22, 2026',
    time: '4:00 PM – 6:30 PM IST',
    venue: 'Independent Café Courtyard',
    address: 'Osmanpura, Aurangabad',
    description: 'A rain-soaked afternoon dedicated to physical book donations, personal recommendations, and warm chai while sharing passages that transformed our perspectives.',
    featuredImage: SITE_IMAGES.meetups.ch12Banner,
    registrationUrl: '',
    registrationStatus: 'past',
    activities: [
      'Chai & Book Pairing',
      'Blind Book Swap',
      'Discussion on Reading in the Age of Short-form Video'
    ],
    highlights: 'Over 40 books circulated among attendees.',
    photos: [
      '/images/enhanced/gallery/roa-019-2026-11-05.webp',
      '/images/enhanced/gallery/roa-051-2026-11-05.webp',
      '/images/enhanced/gallery/roa-057-2026-11-05.webp'
    ],
    isUpcoming: false,
  }
];

export const initialArticles: JournalArticle[] = [
  {
    id: 'journal-1',
    title: 'Why Physical Books and Open Skies Still Matter in MH20',
    slug: 'physical-books-open-skies-mh20',
    author: 'Abdul Rafe Farooqui',
    authorRole: 'Founder, Readers of Aurangabad',
    category: 'Literature & Culture',
    publishedDate: 'November 2, 2026',
    readingTime: '5',
    coverImage: SITE_IMAGES.journalCovers.openSkies,
    excerpt: 'In an era where attention is fractured into seconds, sitting under a neem tree in Aurangabad with a book is a quiet act of gentle rebellion.',
    content: `When we first thought of bringing readers together in Aurangabad, some asked why people would step out on a Sunday morning just to read what they could read in bed.

The answer became clear in the very first hour: reading is inherently solitary, yet the hunger to share what moved us is deeply human. When twenty people sit together on grass under morning sunlight—each lost in a distinct universe—a rare collective stillness fills the air.

Aurangabad is an ancient cradle of memory. From the Ajanta caves where monks carved devotion into rock, to the lines of Wali Dakhani that laid the foundation of Urdu verse, this region has always honored contemplation.

By gathering in our city’s gardens, parks, and quiet corners, we are not creating an elitist literary salon. We are carving out a public sanctuary where a teenager reading manga sits beside a retired schoolmaster reading Marathi prose, and where no one asks for credentials before welcoming you to the circle.`,
    language: 'en',
    tags: ['Community', 'Aurangabad', 'Reading Culture', 'Philosophy'],
    featured: true,
  }
  // Named, first-person reader essays require documented consent before public
  // publication. No such records exist in project data, so only the founder's
  // verified reflection is published in the public seed.
];

// Public reader stories require documented consent. No such records exist in
// project data, so the public seed is intentionally empty.
export const initialReaderStories: ReaderStory[] = [];

export const initialGallery: GalleryItem[] = TRANSFORMED_COMMUNITY_GALLERY;

export const initialReels: MeetupReel[] = [
  {
    id: 'reel-01',
    title: 'Morning Silence under Deccan Palms',
    caption: '60 minutes of uninterrupted silent reading in the heart of Aurangabad. When smartphones are set aside, words come alive.',
    videoUrl: '/media/reels/meetup01.MP4',
    posterUrl: '/images/enhanced/thumbnails/roa-006-2026-11-05-thumb.webp',
    order: 1,
    published: true,
    createdAt: '2026-10-25T09:00:00Z'
  },
  {
    id: 'reel-02',
    title: 'Assembly on Garden Terraces',
    caption: 'Readers arriving with blankets and favorite books across Urdu, Marathi, Hindi, and English.',
    videoUrl: '/media/reels/meetup02.MP4',
    posterUrl: '/images/enhanced/thumbnails/roa-060-2026-11-05-thumb.webp',
    order: 2,
    published: true,
    createdAt: '2026-10-20T09:30:00Z'
  },
  {
    id: 'reel-03',
    title: 'Sunlight & Paperbacks on Stone Steps',
    caption: 'The gentle sound of flipping pages under open sky.',
    videoUrl: '/media/reels/meetup03.MP4',
    posterUrl: '/images/enhanced/thumbnails/roa-059-2026-11-05-thumb.webp',
    order: 3,
    published: true,
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'reel-04',
    title: 'Quiet Sanctuary in the Shade',
    caption: 'A peaceful collective circle where every reader belongs.',
    videoUrl: '/media/reels/meetup04.MP4',
    posterUrl: '/images/enhanced/thumbnails/roa-019-2026-11-05-thumb.webp',
    order: 4,
    published: true,
    createdAt: '2026-10-10T10:00:00Z'
  },
  {
    id: 'reel-05',
    title: 'Holding the Pages That Shape Us',
    caption: 'Diverse paperbacks brought together on one shared mat.',
    videoUrl: '/media/reels/meetup05.MP4',
    posterUrl: '/images/enhanced/thumbnails/roa-051-2026-11-05-thumb.webp',
    order: 5,
    published: true,
    createdAt: '2026-10-05T09:15:00Z'
  },
  {
    id: 'reel-06',
    title: 'Literary Reflections from the Circle',
    caption: 'Readers voluntarily sharing passages that altered their way of seeing the world.',
    videoUrl: '/media/reels/meetup06.MP4',
    posterUrl: '/images/enhanced/thumbnails/roa-049-2026-11-05-thumb.webp',
    order: 6,
    published: true,
    createdAt: '2026-09-28T10:30:00Z'
  },
  {
    id: 'reel-07',
    title: 'Sunday Morning Green Lawn Assembly',
    caption: 'Community members enjoying the tranquil dawn hours with great literature.',
    videoUrl: '/media/reels/meetup07.MP4',
    posterUrl: '/images/enhanced/thumbnails/roa-054-2026-11-05-thumb.webp',
    order: 7,
    published: true,
    createdAt: '2026-09-20T09:00:00Z'
  },
  {
    id: 'reel-08',
    title: 'Chai & Recommendations Gathering',
    caption: 'Post-reading reflections, warm conversations, and unhurried laughter.',
    videoUrl: '/media/reels/meetup08.MP4',
    posterUrl: '/images/enhanced/thumbnails/roa-057-2026-11-05-thumb.webp',
    order: 8,
    published: true,
    createdAt: '2026-09-15T11:00:00Z'
  }
];
