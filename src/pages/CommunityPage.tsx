import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { GalleryItem } from '../types';
import { 
  Users, 
  Heart, 
  Quote, 
  X,
  ArrowRight
} from 'lucide-react';
import { InstagramFeedSection } from '../components/InstagramFeedSection';

export const CommunityPage: React.FC = () => {
  const { stories, gallery, setCurrentPage } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  return (
    <div className="space-y-20 pb-24 paper-grain">
      
      {/* 1. HERO HEADER */}
      <section className="pt-12 sm:pt-16 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E9] border border-[#455240]/20 text-[#2E372B] text-xs font-semibold">
          <Heart className="w-3.5 h-3.5 text-[#8D5B4C]" />
          <span>The Soul of Readers of Aurangabad</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1C1B1A] leading-[1.15]">
          Our Readers & Stories
        </h1>

        <p className="text-lg sm:text-xl text-[#595550] font-serif italic max-w-2xl mx-auto leading-relaxed">
          "A community is not defined by follower counts, but by the warmth with which we listen to each other's stories."
        </p>
      </section>

      {/* 2. READER STORIES (Personal journeys, favourite books) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-[#E8E2D5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C] block mb-1">
              Testimonials of Stillness
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1C1B1A]">
              Voices of Real Readers
            </h2>
          </div>
          <p className="text-xs text-[#8C857B]">
            Authentic reflections from members of the MH20 reading circle
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story) => (
            <div 
              key={story.id}
              className="paper-card p-8 rounded-2xl flex flex-col justify-between space-y-6 relative overflow-hidden"
            >
              <Quote className="w-10 h-10 text-[#E8E2D5] absolute top-4 right-4 -z-0" />

              <div className="space-y-4 relative z-10">
                <p className="font-serif italic text-base sm:text-lg text-[#1C1B1A] leading-relaxed">
                  "{story.quote}"
                </p>

                <p className="text-xs text-[#595550] leading-relaxed">
                  {story.story}
                </p>

                {story.favoriteBooks && story.favoriteBooks.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8D5B4C] block mb-1">
                      Favorite Reads
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {story.favoriteBooks.map((book, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-1 rounded-md text-[11px] bg-[#FAF8F5] text-[#1C1B1A] border border-[#E8E2D5]"
                        >
                          {book}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#F4EFEA] flex items-center gap-3">
                {story.avatar ? (
                  <img
                    src={story.avatar}
                    alt={story.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E8E2D5]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-serif font-bold text-sm">
                    {story.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#1C1B1A]">{story.name}</h4>
                  {story.location && (
                    <span className="text-[11px] text-[#8C857B] block">{story.location}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. COMMUNITY GALLERY (Real Photographs from Meetups) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-[#E8E2D5] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C] block mb-1">
              Visual Archive
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1C1B1A]">
              Community Gallery
            </h2>
          </div>
          <p className="text-xs text-[#8C857B]">
            Click any photo to enlarge and read caption
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative h-64 rounded-xl overflow-hidden cursor-pointer border border-[#E8E2D5] bg-[#1C1B1A]"
            >
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-95 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <span className="text-xs font-semibold text-white leading-snug">
                  {photo.title}
                </span>
                <span className="text-[10px] text-[#E8E2D5] mt-0.5">{photo.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. INSTAGRAM MEDIA — Published photos & videos from Instagram */}
      <InstagramFeedSection />

      {/* 5. OUR TEAM & STEWARDS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C]">
            Humble Leadership
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1C1B1A]">
            The Stewards of the Movement
          </h2>
          <p className="text-sm text-[#595550] max-w-xl mx-auto">
            Prioritizing community warmth over individual acclaim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="paper-card p-6 sm:p-8 rounded-2xl flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-serif font-bold text-lg shrink-0">
              AR
            </div>
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-[#1C1B1A]">
                Abdul Rafe Farooqui
              </h3>
              <p className="text-xs font-semibold text-[#8D5B4C] uppercase tracking-wider">
                Founder, Readers of Aurangabad
              </p>
              <p className="text-xs text-[#595550] leading-relaxed">
                Began the movement to bring the tactile joy of paperbacks back to Aurangabad's public spaces. Believes every reader holds a vital perspective.
              </p>
            </div>
          </div>

          <div className="paper-card p-6 sm:p-8 rounded-2xl flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-[#EBF0E9] text-[#455240] flex items-center justify-center shrink-0 border border-[#455240]/20">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-[#1C1B1A]">
                The Community Volunteers
              </h3>
              <p className="text-xs font-semibold text-[#455240] uppercase tracking-wider">
                Coordinators & Event Stewards
              </p>
              <p className="text-xs text-[#595550] leading-relaxed">
                Local students, educators, and readers who arrive early on Sunday mornings to lay out mats, welcome first-timers, and keep the space friendly.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. INVITATION BANNER */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
          Share Your Reading Journey
        </h3>
        <p className="text-sm text-[#595550] max-w-lg mx-auto">
          Have you attended a meetup or rediscovering books in Aurangabad? We would love to feature your story in this archive.
        </p>
        <button
          onClick={() => {
            setCurrentPage('get-involved');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 bg-[#1C1B1A] hover:bg-[#455240] text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm"
        >
          <span>Share Your Story or Volunteer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* Lightbox Modal for Photo */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="max-w-3xl w-full bg-[#1C1B1A] rounded-2xl overflow-hidden border border-[#363330] relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.title}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
            <div className="p-6 space-y-1 bg-[#1C1B1A]">
              <h3 className="font-serif text-xl font-bold text-white">{selectedPhoto.title}</h3>
              <p className="text-xs text-[#B4ADA2]">{selectedPhoto.caption}</p>
              <span className="text-[10px] text-[#B88B4A] block pt-1">{selectedPhoto.date}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
