import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { InstagramMediaItem } from '../types';
import { 
  Play, 
  ExternalLink, 
  Layers, 
  X, 
  Heart, 
  MessageCircle, 
  ArrowUpRight 
} from 'lucide-react';
import { InstagramIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

export const InstagramFeedSection: React.FC = () => {
  const { instagramMedia } = useApp();
  const [activeMedia, setActiveMedia] = useState<InstagramMediaItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Only show published posts as mandated by the prompt
  const publishedMedia = instagramMedia.filter(m => m.status === 'published');

  const filtered = selectedCategory === 'All'
    ? publishedMedia
    : publishedMedia.filter(m => m.category === selectedCategory);

  const categories = ['All', ...Array.from(new Set(publishedMedia.map(m => m.category)))];

  if (publishedMedia.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D5] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#8D5B4C] mb-1">
            <InstagramIcon className="w-4 h-4" />
            <span>@readers.of.aurangabad</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B1A]">
            Instagram Moments & Reels
          </h2>
          <p className="text-sm text-[#595550] mt-1">
            Glimpses of unhurried reading hours, paperbacks, and conversations in MH20.
          </p>
        </div>

        <a
          href="https://instagram.com/readers.of.aurangabad"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF8F5] border border-[#E8E2D5] text-xs font-semibold text-[#1C1B1A] hover:bg-[#1C1B1A] hover:text-white transition-all shadow-xs"
        >
          <span>Follow @readers.of.aurangabad</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1C1B1A] text-white shadow-xs'
                  : 'bg-white text-[#595550] border border-[#E8E2D5] hover:border-[#1C1B1A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Responsive Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const isVideo = item.mediaType === 'VIDEO';

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveMedia(item)}
              className="paper-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between bg-white border border-[#E8E2D5]"
            >
              <div>
                <div className="relative h-64 bg-[#1C1B1A] overflow-hidden">
                  <img
                    src={item.thumbnailUrl || item.mediaUrl}
                    alt={item.caption.slice(0, 60)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Top Type Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/75 text-white backdrop-blur-xs flex items-center gap-1">
                      {isVideo ? <Play className="w-3 h-3 fill-current" /> : item.mediaType === 'CAROUSEL_ALBUM' ? <Layers className="w-3 h-3" /> : null}
                      <span>{item.mediaType}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5]/90 text-[#8D5B4C] border border-[#E8E2D5]">
                      {item.category}
                    </span>
                  </div>

                  {/* Play Overlay for Videos */}
                  {isVideo && (
                    <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 group-hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-sm transition-all group-hover:scale-110">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <p className="text-xs text-[#2A2826] line-clamp-3 leading-relaxed font-serif">
                    {item.caption}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-[#F4EFEA] flex items-center justify-between text-[11px] text-[#8C857B]">
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>

                <div className="flex items-center gap-3">
                  {item.likesCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-[#8D5B4C]" />
                      <span>{item.likesCount}</span>
                    </span>
                  )}
                  {item.commentsCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-[#455240]" />
                      <span>{item.commentsCount}</span>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox Modal with Video Player or Image Viewer */}
      <AnimatePresence>
        {activeMedia && (
          <div 
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setActiveMedia(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#1C1B1A] border border-[#363330] rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col text-white shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveMedia(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Media Player / Viewer */}
              <div className="relative bg-black flex items-center justify-center max-h-[60vh] overflow-hidden">
                {activeMedia.mediaType === 'VIDEO' ? (
                  <video
                    src={activeMedia.mediaUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full max-h-[60vh] object-contain"
                  />
                ) : (
                  <img
                    src={activeMedia.mediaUrl}
                    alt={activeMedia.caption}
                    className="w-full max-h-[60vh] object-contain"
                  />
                )}
              </div>

              {/* Caption & Metadata Footer */}
              <div className="p-6 space-y-4 bg-[#1C1B1A] overflow-y-auto">
                <div className="flex items-center justify-between text-xs text-[#B4ADA2] border-b border-[#363330] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2A2826] text-[#B88B4A]">
                      {activeMedia.category}
                    </span>
                    <span>{new Date(activeMedia.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <a
                    href={activeMedia.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#B88B4A] hover:underline"
                  >
                    <span>View on Instagram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <p className="text-sm text-[#E8E2D5] leading-relaxed whitespace-pre-line font-serif">
                  {activeMedia.caption}
                </p>

                {(activeMedia.likesCount !== undefined || activeMedia.commentsCount !== undefined) && (
                  <div className="flex items-center gap-4 text-xs text-[#8C857B] pt-2">
                    {activeMedia.likesCount !== undefined && <span>❤️ {activeMedia.likesCount} readers liked</span>}
                    {activeMedia.commentsCount !== undefined && <span>💬 {activeMedia.commentsCount} comments</span>}
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};
