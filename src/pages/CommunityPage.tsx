import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Heart, ArrowRight } from 'lucide-react';
import { CommunityGallery } from '../components/CommunityGallery';
import { scrollToTop } from '../utils/scroll';
import { Button, PageHero, QuoteCard, SectionHeading } from '../components/ui';
import { memberVoices } from '../content/testimonials';

export const CommunityPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div className="rr-home">
      <PageHero
        image="/images/enhanced/gallery/roa-049-2026-11-05.webp"
        alt="Readers of Aurangabad sitting together outdoors"
        eyebrow="The soul of Readers of Aurangabad"
        title="Our Readers & Stories"
        lead="Not follower counts — real people, real meetups, and the stories we share across books and languages."
      />

      {/* Reflections — only the founder's documented reflection is published.
          Reader stories are never shown publicly without documented consent. */}
      <section className="rr-section" aria-label="Reflections from the circle">
        <div className="rr-container">
          <SectionHeading
            eyebrow="01 — Reflections from the circle"
            title="Why we gather"
            description="The founder's own reflection on reading together. We feature reader stories only with explicit permission."
          />
          <div className="rr-voices mt-10">
            {memberVoices.map((voice) => (
              <QuoteCard
                key={voice.id}
                quote={voice.quote}
                memberName={voice.memberName}
                joinYear={voice.joinYear}
                location={voice.location}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Photograph archive */}
      <section className="rr-section rr-section--line" aria-label="Community photographs">
        <div className="rr-container">
          <SectionHeading
            eyebrow="02 — The complete archive"
            title="Community photographs"
            description="Real moments from our gatherings — browse by category and open any image in full screen."
          />
          <div className="mt-10">
            <CommunityGallery compact={false} />
          </div>
        </div>
      </section>

      {/* Stewards — two names on a ruled ledger, not a card grid. */}
      <section className="rr-section rr-section--line" aria-label="The people behind the circle">
        <div className="rr-container">
          <SectionHeading
            eyebrow="03 — Humble stewardship"
            title="The people behind the circle"
            description="Leadership here means arriving early, laying out the mats, and making room for everyone."
            center
          />
          <div className="mt-10 grid gap-px border border-[color:var(--rr-border)] bg-[color:var(--rr-border)] md:grid-cols-2">
            <article className="bg-[color:var(--rr-paper)] p-7 sm:p-9">
              <div className="flex items-start gap-6">
                <div className="rr-image h-20 w-20 shrink-0">
                  <img
                    src="/images/community/founder-abdul-rafe-2026.jpeg"
                    alt="Abdul Rafe Farooqui"
                    loading="lazy"
                    className="object-[center_15%]"
                    onError={(event) => {
                      (event.target as HTMLImageElement).src =
                        '/images/enhanced/thumbnails/roa-061-2026-11-05-thumb.webp';
                    }}
                  />
                </div>
                <div>
                  <h3 className="rr-title rr-title--small">Abdul Rafe Farooqui</h3>
                  <p className="rr-meta mt-2 text-[color:var(--rr-terracotta)]">
                    Founder, Readers of Aurangabad
                  </p>
                </div>
              </div>
              <p className="rr-body mt-6 border-t border-[color:var(--rr-border)] pt-5">
                Began the movement to bring the tactile joy of paperbacks back to Aurangabad&apos;s
                public spaces. Believes every reader holds a vital perspective.
              </p>
            </article>
            <article className="bg-[color:var(--rr-paper)] p-7 sm:p-9">
              <div className="flex items-start gap-6">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center border border-[color:var(--rr-border)] bg-[color:var(--rr-sage)] text-[color:var(--rr-forest)]">
                  <Users className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="rr-title rr-title--small">The community volunteers</h3>
                  <p className="rr-meta mt-2 text-[color:var(--rr-terracotta)]">
                    Coordinators &amp; event stewards
                  </p>
                </div>
              </div>
              <p className="rr-body mt-6 border-t border-[color:var(--rr-border)] pt-5">
                Local students, educators, and readers who arrive early at gathering venues to lay
                out mats, welcome first-timers, and keep the space friendly.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Invitation */}
      <section className="rr-cta-band" aria-label="Share your reading journey">
        <div className="rr-container rr-cta-band__inner">
          <div>
            <Heart className="h-6 w-6 text-[color:var(--rr-brass)]" aria-hidden="true" />
            <h2 className="rr-cta-band__title">Share your reading journey</h2>
            <p className="rr-cta-band__copy">
              Have you attended a meetup or rediscovered books in Aurangabad? We would love to feature
              your story in this archive.
            </p>
          </div>
          <div className="rr-cta-band__actions">
            <Button
              type="button"
              variant="outline-marigold"
              onClick={() => {
                setCurrentPage('get-involved');
                scrollToTop();
              }}
            >
              Share your story or volunteer
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
