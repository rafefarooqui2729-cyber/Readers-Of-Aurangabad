import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';

export const GatheringsPage: React.FC = () => {
  const { meetups, setSelectedMeetup, t } = useApp();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const upcomingMeetups = meetups.filter(m => m.isUpcoming);
  const pastMeetups = meetups.filter(m => !m.isUpcoming);

  const displayedMeetups = filter === 'all' 
    ? meetups 
    : filter === 'upcoming' 
    ? upcomingMeetups 
    : pastMeetups;

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 paper-grain">
      
      {/* 1. HERO HEADER */}
      <section className="pt-6 sm:pt-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E9] border border-[#455240]/20 text-[#2E372B] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#455240]" />
          <span>Sunday Mornings in Aurangabad</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1C1B1A] leading-[1.15]">
          The Gatherings Archive
        </h1>

        <p className="text-lg sm:text-xl text-[#595550] font-serif italic max-w-2xl mx-auto leading-relaxed">
          "A quiet sanctuary under open skies where strangers arrive with paperbacks and leave as friends."
        </p>

        {/* Filter Tabs */}
        <div className="inline-flex p-1.5 rounded-full bg-[#E8E2D5]/50 border border-[#E8E2D5] text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              filter === 'all' ? 'bg-[#1C1B1A] text-white shadow-sm' : 'text-[#595550] hover:text-[#1C1B1A]'
            }`}
          >
            All Gatherings ({meetups.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              filter === 'upcoming' ? 'bg-[#1C1B1A] text-white shadow-sm' : 'text-[#595550] hover:text-[#1C1B1A]'
            }`}
          >
            Upcoming ({upcomingMeetups.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              filter === 'past' ? 'bg-[#1C1B1A] text-white shadow-sm' : 'text-[#595550] hover:text-[#1C1B1A]'
            }`}
          >
            Past Archive ({pastMeetups.length})
          </button>
        </div>
      </section>

      {/* 2. THE MEETUP EXPERIENCE EXPLANATION (Required by prompt) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="paper-card p-8 sm:p-12 rounded-3xl bg-white border border-[#E8E2D5]">
          <div className="max-w-3xl space-y-4 mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C] block">
              What to Expect
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B1A]">
              {t.gatherings.experienceHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#595550] leading-relaxed">
              Never been to a silent reading meetup before? Here is how our typical two hours unfold:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
              <span className="text-xl font-serif font-bold text-[#455240]">01</span>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Silent Reading Session</h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                60 minutes of undistracted, deep immersion in your own book. Phones silenced, nature breathing around us.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
              <span className="text-xl font-serif font-bold text-[#8D5B4C]">02</span>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Book Discussions & Reflections</h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                Voluntary sharing: tell the circle what you read, what struck you, or a passage that challenged your perspective.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
              <span className="text-xl font-serif font-bold text-[#455240]">03</span>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Reader Recommendations</h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                Discover titles across English, Marathi, Urdu, and Hindi literature that you won't find on algorithm feeds.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
              <span className="text-xl font-serif font-bold text-[#8D5B4C]">04</span>
              <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">Chai & Creative Storytelling</h4>
              <p className="text-xs text-[#595550] leading-relaxed">
                Informal conversations, poetry recitation, and community camaraderie over warm chai or local snacks.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. MEETUP ARCHIVE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {displayedMeetups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedMeetups.map((meetup) => (
              <div 
                key={meetup.id}
                className="paper-card rounded-2xl overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-52 sm:h-56 overflow-hidden bg-[#1C1B1A]">
                    <img
                      src={meetup.featuredImage}
                      alt={meetup.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                      {meetup.edition && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#1C1B1A] text-white">
                          {meetup.edition}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                        meetup.isUpcoming 
                          ? 'bg-[#EBF0E9] text-[#2E372B] border border-[#455240]/20'
                          : 'bg-[#FAF8F5] text-[#595550] border border-[#E8E2D5]'
                      }`}>
                        {meetup.isUpcoming ? 'Upcoming Event' : 'Archived Chapter'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="font-serif text-2xl font-bold text-[#1C1B1A] group-hover:text-[#455240] transition-colors leading-snug">
                      {meetup.title}
                    </h3>

                    <p className="text-sm text-[#595550] line-clamp-3 leading-relaxed">
                      {meetup.description}
                    </p>

                    <div className="pt-2 space-y-2 text-xs text-[#8C857B] border-t border-[#F4EFEA]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#455240]" />
                        <span className="font-medium text-[#1C1B1A]">{meetup.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#455240]" />
                        <span>{meetup.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#8D5B4C]" />
                        <span className="truncate">{meetup.venue}</span>
                      </div>
                    </div>

                    {/* Activities List */}
                    {meetup.activities && meetup.activities.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {meetup.activities.slice(0, 2).map((act, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-[#FAF8F5] text-[#595550] border border-[#E8E2D5]">
                            {act}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between gap-3 border-t border-[#F4EFEA]">
                  <button
                    onClick={() => setSelectedMeetup(meetup)}
                    className="text-xs font-semibold text-[#595550] hover:text-[#1C1B1A] transition-colors"
                  >
                    View Details & Photos
                  </button>

                  {meetup.isUpcoming && meetup.registrationStatus === 'open' ? (
                    <a
                      href={meetup.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#1C1B1A] hover:bg-[#455240] text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                      <span>RSVP via Form</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button
                      onClick={() => setSelectedMeetup(meetup)}
                      className="text-xs font-semibold text-[#8D5B4C] hover:underline"
                    >
                      Browse Chapter Archive →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">No events in this category</h3>
            <p className="text-sm text-[#595550]">
              {t.gatherings.emptyUpcoming}
            </p>
          </div>
        )}

      </section>

    </div>
  );
};
