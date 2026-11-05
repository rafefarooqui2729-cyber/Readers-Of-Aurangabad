import re

with open('src/data/imageMapping.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Update gallery items: replace /images/processed/gallery/gal-XX-desktop.webp with /images/edited/gallery/gallery-XX.webp
# and mobile / thumb URLs
def replace_gallery(match):
    num = int(match.group(1))
    return f'''"imageUrl": "/images/edited/gallery/gallery-{num:02d}.webp",
    "mobileUrl": "/images/edited/gallery/gallery-{num:02d}-mobile.webp",
    "thumbUrl": "/images/edited/gallery/gallery-{num:02d}-thumb.webp"'''

content = re.sub(
    r'"imageUrl":\s*"/images/processed/gallery/gal-(\d+)-desktop\.webp",\s*"mobileUrl":\s*"/images/processed/mobile/gal-\d+-mobile\.webp",\s*"thumbUrl":\s*"/images/processed/gallery/gal-\d+-thumb\.webp"',
    replace_gallery,
    content
)

# Update SITE_IMAGES
new_site_images = """export const SITE_IMAGES = {
  hero: {
    grandGatheringDesktop: '/images/edited/hero/hero-main-desktop.webp',
    grandGatheringTablet: '/images/edited/hero/hero-main-tablet.webp',
    grandGatheringMobile: '/images/edited/hero/hero-main-mobile.webp',
    readingSteps: '/images/edited/hero/hero-portrait-card.webp',
    readingStepsMobile: '/images/edited/hero/hero-portrait-mobile.webp',
    terraceGathering: '/images/edited/hero/hero-secondary.webp',
  },
  founder: {
    portrait: '/images/edited/community/founder-wide.webp',
    avatar: '/images/edited/community/founder-portrait.webp',
  },
  readerAvatars: {
    ananya: '/images/edited/community/reader-1-avatar.webp',
    zaid: '/images/edited/community/reader-2-avatar.webp',
    kavita: '/images/edited/community/reader-3-avatar.webp',
  },
  journalCovers: {
    openSkies: '/images/edited/journal/journal-cover-1.webp',
    morningPeace: '/images/edited/journal/journal-cover-2.webp',
    deccanLiterature: '/images/edited/journal/journal-cover-3.webp',
    marathiVachan: '/images/edited/journal/journal-cover-4.webp',
  },
  meetups: {
    ch14Banner: '/images/edited/gatherings/meetup-card-1.webp',
    ch13Banner: '/images/edited/gatherings/meetup-card-2.webp',
    ch12Banner: '/images/edited/gatherings/meetup-card-3.webp',
    ch11Banner: '/images/edited/gatherings/meetup-card-4.webp',
  },
  story: {
    firstCircle: '/images/edited/community/community-banner.webp',
    historicVenue: '/images/edited/cards/card-1.webp',
    terraceWide: '/images/edited/hero/hero-secondary.webp',
  },
  getInvolved: {
    volunteerBanner: '/images/edited/community/community-banner.webp',
  },
  contact: {
    venueLawn: '/images/edited/cards/card-2.webp',
  }
} as const;"""

content = re.sub(r'export const SITE_IMAGES = \{[\s\S]*?\} as const;', new_site_images, content)

with open('src/data/imageMapping.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated imageMapping.ts successfully!")
