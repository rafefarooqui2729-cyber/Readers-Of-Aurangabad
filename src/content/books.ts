import type { BookRecommendation } from './types';

export const bookOfTheMonth: BookRecommendation = {
  id: 'botm-current',
  title: 'Smritichitre: The Memoirs of Lakshmibai Tilak',
  author: 'Lakshmibai Tilak (Translated by Shanta Gokhale)',
  coverImage: '/images/enhanced/gallery/roa-015-2026-11-05.webp',
  oneLineReason: 'A vibrant, warm Marathi memoir that speaks to resilience, literature, and quiet courage in Maharashtra.',
  suggestedBy: 'Suggested during Chapter 13 gathering',
  isBookOfTheMonth: true,
};

export const readingList: BookRecommendation[] = [
  {
    id: 'book-1',
    title: 'The Great Indian Novel',
    author: 'Shashi Tharoor',
    coverImage: '/images/enhanced/gallery/roa-017-2026-11-05.webp',
    oneLineReason: 'A sharp, satirical retelling of the Mahabharata against twentieth-century Indian political history.',
    suggestedBy: 'Abdul Rafe Farooqui',
  },
  {
    id: 'book-2',
    title: 'Gitanjali',
    author: 'Rabindranath Tagore',
    coverImage: '/images/enhanced/gallery/roa-019-2026-11-05.webp',
    oneLineReason: 'Song offerings of devotion, nature, and humanity that demand slow, morning reading.',
    suggestedBy: 'Shared at Chapter 12 exchange',
  },
  {
    id: 'book-3',
    title: 'Karmelin',
    author: 'Damodar Mauzo',
    coverImage: '/images/enhanced/gallery/roa-021-2026-11-05.webp',
    oneLineReason: 'Sahitya Akademi-winning Konkani novel documenting working-class life and human dignity.',
    suggestedBy: 'Community Library shelf',
  },
];
