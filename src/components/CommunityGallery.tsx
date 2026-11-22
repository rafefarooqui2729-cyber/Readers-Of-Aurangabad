import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { PROCESSED_IMAGES, type ProcessedImage } from '../data/imageManifest';
import { useApp } from '../context/AppContext';
import { useModalEscapeDismiss } from '../utils/modalAccessibility';
import type { GalleryItem } from '../types';

// ─── Editorial Category System ───────────────────────────────────────────────
type GalleryCategory = 'all' | 'reading-together' | 'meetup-moments' | 'community-portraits' | 'behind-the-scenes';

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  'all': 'All Moments',
  'reading-together': 'Reading Together',
  'meetup-moments': 'Meetup Moments',
  'community-portraits': 'Community Portraits',
  'behind-the-scenes': 'Behind the Scenes',
};

// Map original imageManifest categories + orientation to editorial categories
const LANDSCAPE_IDS = new Set([
  'roa-006-2026-11-05', 'roa-009-2026-11-05', 'roa-019-2026-11-05',
  'roa-049-2026-11-05', 'roa-051-2026-11-05', 'roa-054-2026-11-05',
]);
const READING_SESSION_IDS = new Set([
  'roa-057-2026-11-05', 'roa-059-2026-11-05', 'roa-060-2026-11-05', 'roa-061-2026-11-05',
]);
const BEHIND_SCENES_IDS = new Set([
  'roa-001-2026-11-05', 'roa-002-2026-11-05', 'roa-003-2026-11-05',
  'roa-004-2026-11-05', 'roa-005-2026-11-05', 'roa-010-2026-11-05',
]);

function getEditorialCategory(img: ProcessedImage): GalleryCategory {
  if (LANDSCAPE_IDS.has(img.id)) return 'meetup-moments';
  if (READING_SESSION_IDS.has(img.id)) return 'reading-together';
  if (BEHIND_SCENES_IDS.has(img.id)) return 'behind-the-scenes';
  if (img.orientation === 'portrait') return 'reading-together';
  if (img.orientation === 'square') return 'community-portraits';
  return 'community-portraits';
}

interface EnrichedImage extends ProcessedImage {
  editorialCategory: GalleryCategory;
  /** Grid sizing hint for masonry feel */
  gridClass: string;
  /** Accessible description / database title */
  alt: string;
}

// Assign grid span classes to create visual rhythm
function assignGridClass(img: ProcessedImage, index: number): string {
  if (img.orientation === 'landscape') return 'col-span-2 row-span-2';
  if (img.orientation === 'portrait') return 'col-span-1 row-span-2';
  // Square: every 7th is featured
  if (index % 7 === 0) return 'col-span-2 row-span-2';
  return 'col-span-1 row-span-1';
}

const enriched: EnrichedImage[] = PROCESSED_IMAGES.map((img, idx) => ({
  ...img,
  editorialCategory: getEditorialCategory(img),
  gridClass: assignGridClass(img, idx),
  alt: `ROA ${img.category} photograph`,
}));

// Paths already covered by the static manifest. The seeded gallery rows use
// these same local assets, so they must not be rendered twice.
const MANIFEST_IMAGE_PATHS = new Set<string>();

function normalizeImagePath(path: string): string {
  return path.trim().split(/[?#]/)[0];
}

for (const img of PROCESSED_IMAGES) {
  for (const candidate of [img.web, img.gallery, img.thumbnail, img.enhanced, img.mobile, img.hero, img.journal]) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      MANIFEST_IMAGE_PATHS.add(normalizeImagePath(candidate));
    }
  }
}

function isManifestImagePath(path: string): boolean {
  return MANIFEST_IMAGE_PATHS.has(normalizeImagePath(path));
}

/** Converts a database/localStorage gallery row into the editorial gallery shape. */
function toGalleryEnrichedImage(
  item: GalleryItem,
  resolved: { imageUrl: string; thumbnailUrl: string },
  index: number
): EnrichedImage {
  const title = item.title?.trim() || 'Community photograph';

  return {
    id: item.id,
    originalFilename: item.imageUrl,
    category: 'Community Uploads',
    orientation: 'square',
    width: 0,
    height: 0,
    enhanced: resolved.imageUrl,
    web: resolved.imageUrl,
    thumbnail: resolved.thumbnailUrl || resolved.imageUrl,
    gallery: resolved.imageUrl,
    mobile: null,
    hero: null,
    journal: null,
    editorialCategory: 'community-portraits',
    gridClass: index % 7 === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1',
    alt: title
  };
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
interface LightboxProps {
  images: EnrichedImage[];
  current: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ images, current, onClose, onNext, onPrev }) => {
  const img = images[current];
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dismiss = useModalEscapeDismiss(true, onClose, surfaceRef);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext, onPrev]);

  // Touch swipe
  const touchStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) {
        onNext();
      } else {
        onPrev();
      }
    }
    touchStart.current = null;
  };

  return (
    <motion.div
      ref={surfaceRef}
      role="dialog"
      aria-modal="true"
      aria-label="Gallery lightbox"
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="p3-modal-overlay p3-lightbox fixed inset-0 z-[200] flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="p3-modal-backdrop absolute inset-0"
        onClick={dismiss}
      />

      <button
        onClick={dismiss}
        className="p3-icon-button p3-modal-close absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center border-[color:var(--rr-border)] bg-[color:var(--rr-dark)] text-[color:var(--rr-on-dark)] hover:text-[color:var(--rr-brass)] transition-colors"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="p3-lightbox-counter absolute left-5 top-5 z-10 rr-meta border border-[color:var(--rr-border)] bg-[color:var(--rr-dark)]/85 px-3 py-1.5 text-[color:var(--rr-on-dark)]">
        {current + 1} / {images.length}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="p3-icon-button p3-lightbox-nav absolute left-4 z-20 flex h-11 w-11 items-center justify-center border-[color:var(--rr-border)] bg-[color:var(--rr-dark)] text-[color:var(--rr-on-dark)] hover:text-[color:var(--rr-brass)] transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="p3-icon-button p3-lightbox-nav absolute right-4 z-20 flex h-11 w-11 items-center justify-center border-[color:var(--rr-border)] bg-[color:var(--rr-dark)] text-[color:var(--rr-on-dark)] hover:text-[color:var(--rr-brass)] transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={img.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="p3-lightbox-frame relative z-10 max-h-[85vh] w-full max-w-5xl px-16"
        >
          <img
            src={img.gallery || img.web}
            alt={img.alt}
            className="h-full max-h-[78vh] w-full border border-[color:var(--rr-border)] object-contain"
          />
          <div className="mt-4 flex items-center gap-3 border-t border-[color:var(--rr-border)] pt-3">
            <span className="p3-lightbox-caption rr-meta text-[color:var(--rr-brass)]">
              {CATEGORY_LABELS[img.editorialCategory]}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Gallery Component ─────────────────────────────────────────────────
interface CommunityGalleryProps {
  /** If true, show a compact 18-image preview grid (for homepage) */
  compact?: boolean;
  /** If set, pre-filter to this category */
  initialCategory?: GalleryCategory;
}

export const CommunityGallery: React.FC<CommunityGalleryProps> = ({
  compact = false,
  initialCategory = 'all',
}) => {
  const { gallery, getSignedGalleryUrl } = useApp();
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>(initialCategory);
  const [visibleCount, setVisibleCount] = useState(compact ? 18 : 24);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [databaseImages, setDatabaseImages] = useState<EnrichedImage[]>([]);
  const shouldReduceMotion = useReducedMotion();

  // Resolve database-backed gallery rows. Private Storage paths become temporary
  // signed URLs; local paths and external HTTPS URLs pass through unchanged.
  useEffect(() => {
    let cancelled = false;

    const loadDatabaseImages = async () => {
      const candidates = gallery.filter(item =>
        item.imageUrl &&
        item.imageUrl.trim() !== '' &&
        !isManifestImagePath(item.imageUrl)
      );

      if (candidates.length === 0) {
        if (!cancelled) setDatabaseImages([]);
        return;
      }

      const resolved = await Promise.all(
        candidates.map(async (item) => {
          try {
            const imageUrl = await getSignedGalleryUrl(item.imageUrl, 'original');
            if (!imageUrl) return null;

            let thumbnailUrl = imageUrl;
            if (item.thumbnailUrl) {
              try {
                thumbnailUrl = await getSignedGalleryUrl(item.thumbnailUrl, 'thumbnail') || imageUrl;
              } catch (thumbnailError) {
                console.error(`Unable to resolve gallery thumbnail ${item.id}:`, thumbnailError);
              }
            }

            return { item, imageUrl, thumbnailUrl };
          } catch (error) {
            console.error(`Unable to resolve gallery image ${item.id}:`, error);
            return null;
          }
        })
      );

      if (cancelled) return;

      const nextImages: EnrichedImage[] = [];
      resolved.forEach((entry, index) => {
        if (entry) {
          nextImages.push(toGalleryEnrichedImage(entry.item, entry, index));
        }
      });

      setDatabaseImages(nextImages);
    };

    void loadDatabaseImages();
    return () => { cancelled = true; };
  }, [gallery, getSignedGalleryUrl]);

  const allImages = databaseImages.length > 0
    ? [...databaseImages, ...enriched]
    : enriched;

  const filtered = activeCategory === 'all'
    ? allImages
    : allImages.filter(img => img.editorialCategory === activeCategory);

  const visible = filtered.slice(0, visibleCount);

  const handleCategoryChange = (cat: GalleryCategory) => {
    setActiveCategory(cat);
    setVisibleCount(compact ? 18 : 24);
  };

  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => {
    setLightboxIndex(prev => prev !== null ? (prev + 1) % filtered.length : null);
  };
  const prevImage = () => {
    setLightboxIndex(prev => prev !== null ? (prev - 1 + filtered.length) % filtered.length : null);
  };

  const categories: GalleryCategory[] = ['all', 'reading-together', 'meetup-moments', 'community-portraits', 'behind-the-scenes'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="space-y-8">
      <div className="rr-filter-row justify-center border-b border-[color:var(--rr-border)] pb-5">
        {categories.map(cat => (
          <motion.button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            aria-pressed={activeCategory === cat}
            className="rr-filter cursor-pointer"
          >
            {CATEGORY_LABELS[cat]}
            {activeCategory === cat && (
              <span className="ml-1.5 opacity-70">
                {filtered.length}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {visible.map((img, idx) => (
            <motion.div
              key={img.id}
              variants={itemVariants}
              className="rr-panel group cursor-pointer p-1.5"
              onClick={() => openLightbox(idx)}
              role="button"
              tabIndex={0}
              aria-label={`Open gallery image: ${img.editorialCategory}`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openLightbox(idx);
                }
              }}
              whileHover={{ scale: shouldReduceMotion ? 1 : 1.015 }}
              transition={{ duration: 0.25 }}
            >
              <div className="rr-image relative aspect-[4/5] overflow-hidden bg-[color:var(--rr-forest)]">
                <img
                  src={img.thumbnail || img.web}
                  alt={img.alt}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full object-cover object-center ${shouldReduceMotion ? '' : 'transition-transform duration-700 ease-out group-hover:scale-[1.04]'}`}
                />
                <div className={`absolute inset-0 flex flex-col justify-end bg-[color:var(--rr-dark)]/70 p-4 opacity-0 group-hover:opacity-100 ${shouldReduceMotion ? '' : 'transition-opacity duration-300'}`}>
                  <span className="rr-meta mb-2 text-[color:var(--rr-brass)]">
                    {CATEGORY_LABELS[img.editorialCategory]}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-on-dark)]">
                    <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-2">
                <span className="rr-meta text-[color:var(--rr-muted)]">
                  {CATEGORY_LABELS[img.editorialCategory]}
                </span>
                <span className="rr-meta text-[color:var(--rr-terracotta)]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {visibleCount < filtered.length && (
        <div className="pt-3 text-center">
          <motion.button
            onClick={() => setVisibleCount(prev => prev + 12)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rr-btn rr-btn--outline cursor-pointer"
          >
            Load More ({filtered.length - visibleCount} remaining)
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={filtered}
            current={lightboxIndex}
            onClose={closeLightbox}
            onNext={nextImage}
            onPrev={prevImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
