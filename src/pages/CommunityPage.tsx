import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Heart, ArrowRight } from 'lucide-react';
import { CommunityGallery } from '../components/CommunityGallery';
import { scrollToTop } from '../utils/scroll';
import { Button, PageHero, PaperPanel, SectionHeading } from '../components/ui';
import { memberVoices } from '../content/testimonials';

export const CommunityPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div className="paper-grain overflow-hidden pb-16">
      <PageHero
        image="/images/enhanced/gallery/roa-049-2026-11-05.webp"
        alt="Readers of Aurangabad sitting together outdoors"
        eyebrow="The soul of Readers of Aurangabad"
        title="Our Readers & Stories"
        lead="A community is not defined by follower counts, but by the warmth with which we listen to each other's stories."
      />

      <div className="space-y-14 sm:space-y-20">
        {/* Reflections â€” only the founder's documented reflection is published.
            Reader stories are never shown publicly without documented consent. */}
        <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14 lg:px-12">
          <SectionHeading
            eyebrow="01 â€” Reflections from the circle"
            title="Why we gather"
            description="The founder's own reflection on reading together. We feature reader stories only with explicit permission."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {memberVoices.map((voice) => (
              <PaperPanel key={voice.id} className="flex h-full flex-col p-6 sm:p-8">
                <figure className="flex h-full flex-col">
                  <blockquote className="font-serif text-lg italic leading-relaxed text-[#171717] dark:text-[#F4F0E8] sm:text-xl">
                    &ldquo;{voice.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 border-t border-[#171717]/15 pt-5 dark:border-[#F4F0E8]/15">
                    <span className="block font-display text-sm font-bold text-[#171717] dark:text-[#F4F0E8]">
                      {voice.memberName}
                    </span>
                    <span className="block font-sans text-[11px] text-[#6E6960] dark:text-[#B8B2A8]">
                      {voice.joinYear}
                    </span>
                  </figcaption>
                </figure>
              </PaperPanel>
            ))}
          </div>
        </section>

        {/* Photograph archive */}
        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="02 â€” The complete archive"
            title="Community photographs"
            description="Real moments from our Sunday gatherings â€” browse by category and open any image in full screen."
          />
          <div className="mt-8">
            <CommunityGallery compact={false} />
          </div>
        </section>

        {/* Stewards */}
        <section className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="03 â€” Humble stewardship"
            title="The people behind the circle"
            description="Leadership here means arriving early, laying out the mats, and making room for everyone."
            center
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <PaperPanel className="flex items-start gap-5 p-6 sm:p-8">
              <img
                src="/images/enhanced/community/founder-portrait.webp"
                alt="Abdul Rafe Farooqui"
                loading="lazy"
                className="h-16 w-16 shrink-0 rounded-none object-cover object-[center_15%]"
                onError={(event) => {
                  (event.target as HTMLImageElement).src =
                    '/images/enhanced/thumbnails/roa-061-2026-11-05-thumb.webp';
                }}
              />
              <div>
                <h3 className="font-display text-xl font-bold text-[#171717] dark:text-[#F4F0E8]">
                  Abdul Rafe Farooqui
                </h3>
                <p className="mt-1 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#F4512C]">
                  Founder, Readers of Aurangabad
                </p>
                <p className="mt-3 font-sans text-sm leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
                  Began the movement to bring the tactile joy of paperbacks back to Aurangabad&apos;s
                  public spaces. Believes every reader holds a vital perspective.
                </p>
              </div>
            </PaperPanel>
            <PaperPanel className="flex items-start gap-5 p-6 sm:p-8">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-none border border-[#6E6960]/30 text-[#6E6960]">
                <Users className="h-7 w-7" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-[#171717] dark:text-[#F4F0E8]">
                  The community volunteers
                </h3>
                <p className="mt-1 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#6E6960]">
                  Coordinators &amp; event stewards
                </p>
                <p className="mt-3 font-sans text-sm leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
                  Local students, educators, and readers who arrive early on Sunday mornings to lay
                  out mats, welcome first-timers, and keep the space friendly.
                </p>
              </div>
            </PaperPanel>
          </div>
        </section>

        {/* Invitation */}
        <section className="mx-auto max-w-3xl px-5 pb-4 text-center sm:px-8">
          <Heart className="mx-auto h-7 w-7 text-[#F4512C]" aria-hidden="true" />
          <h3 className="mt-4 font-display text-2xl font-bold text-[#171717] dark:text-[#F4F0E8] sm:text-3xl">
            Share your reading journey
          </h3>
          <p className="mx-auto mt-3 max-w-lg font-sans text-sm leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
            Have you attended a meetup or rediscovered books in Aurangabad? We would love to feature
            your story in this archive.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setCurrentPage('get-involved');
              scrollToTop();
            }}
          >
            Share your story or volunteer
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </section>
      </div>
    </div>
  );
};
