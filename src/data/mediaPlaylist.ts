/*
Add reel files under public/media/reels and append an entry below.
Place the announcement MP4 under public/media/announcement and change announcementReel.filename if needed.
*/

export interface ReelPlaylistEntry {
  filename: string;
  title: string;
  caption?: string;
  category: 'Reels';
  poster?: string;
}

export const announcementReel = {
  filename: '/media/announcement/announcement.mp4',
  title: 'Readers of Aurangabad Announcement',
  caption: 'Community announcement'
};

export const reelPlaylist: ReelPlaylistEntry[] = [
  { filename: '/media/reels/meetup01.MP4', title: 'Meetup Reel 01', category: 'Reels', poster: '/images/enhanced/thumbnails/roa-006-2026-11-05-thumb.webp' },
  { filename: '/media/reels/meetup02.MP4', title: 'Meetup Reel 02', category: 'Reels', poster: '/images/enhanced/thumbnails/roa-060-2026-11-05-thumb.webp' },
  { filename: '/media/reels/meetup03.MP4', title: 'Meetup Reel 03', category: 'Reels', poster: '/images/enhanced/thumbnails/roa-059-2026-11-05-thumb.webp' },
  { filename: '/media/reels/meetup04.MP4', title: 'Meetup Reel 04', category: 'Reels', poster: '/images/enhanced/thumbnails/roa-019-2026-11-05-thumb.webp' },
  { filename: '/media/reels/meetup05.MP4', title: 'Meetup Reel 05', category: 'Reels', poster: '/images/enhanced/thumbnails/roa-051-2026-11-05-thumb.webp' },
  { filename: '/media/reels/meetup06.MP4', title: 'Meetup Reel 06', category: 'Reels', poster: '/images/enhanced/thumbnails/roa-049-2026-11-05-thumb.webp' },
  { filename: '/media/reels/meetup07.MP4', title: 'Meetup Reel 07', category: 'Reels', poster: '/images/enhanced/thumbnails/roa-054-2026-11-05-thumb.webp' },
  { filename: '/media/reels/meetup08.MP4', title: 'Meetup Reel 08', category: 'Reels', poster: '/images/enhanced/thumbnails/roa-057-2026-11-05-thumb.webp' }
];
