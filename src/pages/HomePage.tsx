import React, { useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  BookOpen,
  Users,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { FeaturedAnnouncementReel } from '../components/FeaturedAnnouncementReel';
import { ReelCollectionSection } from '../components/ReelCollectionSection';
import { CommunityGallery } from '../components/CommunityGallery';
import { UpcomingEventSpotlight } from '../components/UpcomingEventSpotlight';
import { JoinSection } from '../components/JoinSection';
import { StatBlock } from '../components/ui/StatBlock';
import { QuoteCard } from '../components/ui/QuoteCard';
import { EditorialSectionHeading } from '../components/ui';
import { FeaturedBookCard } from '../components/FeaturedBookCard';
import { readingList } from '../content/books';
import { scrollToTop } from '../utils/scroll';
import { useModalEscapeDismiss } from '../utils/modalAccessibility';
import {
  findActiveAnnouncementById,
  getAnnouncementNavigationId,
  scrollToAnnouncement,
} from '../utils/announcementNavigation';
import { communityStats } from '../content/stats';
import { memberVoices } from '../content/testimonials';
import { siteConfig } from '../content/siteConfig';
import { isMeetupUpcoming, getMeetupStartMs } from '../utils/meetupStatus';
import { getSafeRegistrationUrl } from '../utils/url';
import { teamMembers } from '../content/team';

export const HomePage: React.FC = () => {
  const {
    t,
    setCurrentPage,
    meetups,
    articles,
    announcements,
    setSelectedArticle,
    setSelectedMeetup,
    announcementNavigationId,
    clearAnnouncementNavigation,
    dbLoading,
    isPageLoading,
  } = useApp();

  const shouldReduceMotion = useReducedMotion();
  const [fullAnnouncementId, setFullAnnouncementId] = React.useState<string | null>(null);
  const [announcementsNow] = React.useState(() => Date.now());

  const upcomingMeetups = useMemo(
    () =>
      meetups
        .filter((meetup) => isMeetupUpcoming(meetup))
        .sort((a, b) => getMeetupStartMs(a) - getMeetupStartMs(b)),
    [meetups],
  );
  const nearestUpcomingMeetup = upcomingMeetups[0] || null;

  const latestAnnouncement = useMemo(
    () =>
      [...announcements]
        .filter(
          (announcement) =>
            announcement.isPublished &&
            (!announcement.expiresAt ||
              new Date(announcement.expiresAt).getTime() >= announcementsNow),
        )
        .sort(
          (a, b) =>
            new Date(b.publishedAt || b.createdAt).getTime() -
            new Date(a.publishedAt || a.createdAt).getTime(),
        )[0] || null,
    [announcements, announcementsNow],
  );

  const announcementTargetId =
    announcementNavigationId ||
    (typeof window === 'undefined' ? null : getAnnouncementNavigationId(window.location.search));
  const announcementToShow = (
    announcementTargetId
      ? findActiveAnnouncementById(announcements, announcementTargetId, announcementsNow)
      : null
  ) || latestAnnouncement;

  const fullAnnouncement = fullAnnouncementId
    ? announcements.find((announcement) => announcement.id === fullAnnouncementId) || null
    : null;
  const fullAnnouncementSurfaceRef = useRef<HTMLDivElement>(null);
  const dismissFullAnnouncement = useModalEscapeDismiss(
    Boolean(fullAnnouncement),
    () => setFullAnnouncementId(null),
    fullAnnouncementSurfaceRef,
  );

  React.useEffect(() => {
    if (!announcementNavigationId || dbLoading || isPageLoading) return;

    const target = findActiveAnnouncementById(
      announcements,
      announcementNavigationId,
      announcementsNow,
    );
    if (!target) {
      clearAnnouncementNavigation(announcementNavigationId);
      return;
    }

    let frameId = 0;
    let attempts = 0;
    const scrollWhenReady = () => {
      if (scrollToAnnouncement(target.id, Boolean(shouldReduceMotion))) {
        clearAnnouncementNavigation(target.id);
        return;
      }

      attempts += 1;
      if (attempts >= 120) {
        clearAnnouncementNavigation(target.id);
        return;
      }
      frameId = window.requestAnimationFrame(scrollWhenReady);
    };

    frameId = window.requestAnimationFrame(scrollWhenReady);
    return () => window.cancelAnimationFrame(frameId);
  }, [
    announcementNavigationId,
    announcements,
    announcementsNow,
    clearAnnouncementNavigation,
    dbLoading,
    isPageLoading,
    shouldReduceMotion,
  ]);

  const featuredArticle = articles.find((article) => article.featured) || articles[0];
  const recentArticles = articles.slice(0, 3);

  const goTo = (page: 'story' | 'gatherings' | 'community' | 'journal' | 'contact' | 'get-involved') => {
    setCurrentPage(page);
    scrollToTop();
  };

  return (
    <div className="rr-home">
      {/* Identity strip */}
      <div className="rr-masthead">
        <div className="rr-container rr-masthead__inner">
          <span>MH20 / Chhatrapati Sambhajinagar</span>
          <span className="rr-masthead__center">Read. Meet. Repeat.</span>
          <span>Est. {siteConfig.establishedYear}</span>
        </div>
      </div>

      {/* Signature hero */}
      <section className="rr-home-hero" aria-label="Readers of Aurangabad — City Reading Collective">
        <div className="rr-home-hero__media">
          <picture>
            <source media="(max-width: 640px)" srcSet="/images/enhanced/mobile/roa-hero-mobile.webp" />
            <source media="(min-width: 1441px)" srcSet="/images/enhanced/hero/roa-hero-4k-master.webp" />
            <source media="(min-width: 641px)" srcSet="/images/enhanced/hero/roa-group-hero-clean.webp" />
            <img
              src="/images/enhanced/hero/roa-group-hero-clean.webp"
              alt="Readers of Aurangabad gathered for an outdoor reading meetup"
              width={2560}
              height={1260}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <span className="rr-image-label">Real meetups · Real readers · MH20</span>
        </div>

        <motion.div
          className="rr-home-hero__copy"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="rr-eyebrow">City Reading Collective</p>
          <h1 className="rr-home-hero__title">
            Read.<br />
            <em>Meet.</em><br />
            Repeat.
          </h1>
          <p className="rr-home-hero__lead">
            Aurangabad's offline reading community. Bring a book, find your people, and make reading part of city life.
          </p>
          <p className="rr-body rr-home-hero__support">
            {t.hero.supporting}
          </p>
          <div className="rr-home-hero__actions">
            <button type="button" className="rr-btn" onClick={() => goTo('get-involved')}>
              {t.hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className="rr-link" onClick={() => goTo('gatherings')}>
              See gatherings
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="rr-home-hero__footnote">
            Readers of Aurangabad · MH20 · Est. {siteConfig.establishedYear}
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="rr-proof-band" aria-label="Community statistics">
        <div className="rr-container rr-stat-grid rr-stat-grid--four">
          {communityStats.map((stat) => (
            <StatBlock key={stat.id} value={stat.value} suffix={stat.suffix} label={stat.label} />
          ))}
        </div>
      </section>

      {/* Intro */}
      <section className="rr-section rr-intro" aria-label="What this is">
        <div className="rr-container rr-intro__grid">
          <div className="rr-intro__copy">
            <p className="rr-eyebrow">What this is</p>
            <h2 className="rr-title">A reading culture,<br />built in public.</h2>
            <p className="rr-lede mt-5">
              Readers of Aurangabad is a real offline community where people show up with books, read together, and talk across languages, genres, and generations.
            </p>
            <blockquote className="rr-intro__quote">
              “{t.intro.body}”
            </blockquote>
            <button type="button" className="rr-link mt-6" onClick={() => goTo('story')}>
              Read our story <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="rr-intro__media rr-image">
            <img
              src="/images/enhanced/community/community-banner-wide.webp"
              alt="Readers of Aurangabad community at a gathering"
              loading="lazy"
            />
            <span className="rr-image-label">From the community archive</span>
          </div>
        </div>
      </section>

      {/* Upcoming gatherings */}
      <section className="rr-section rr-section--line" aria-label={t.gatherings.upcomingHeading}>
        <div className="rr-container">
          <EditorialSectionHeading
            eyebrow="On the calendar"
            title={t.gatherings.upcomingHeading}
            description={t.gatherings.upcomingSub}
            action={
              <button type="button" className="rr-link" onClick={() => goTo('gatherings')}>
                {t.gatherings.viewAllGatherings} <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            }
          />

          {upcomingMeetups.length > 0 ? (
            <div className="rr-event-list">
              {upcomingMeetups.slice(0, 3).map((meetup) => {
                const registrationUrl = getSafeRegistrationUrl(meetup);
                const canRegister = meetup.registrationStatus === 'open' && registrationUrl;
                return (
                  <article key={meetup.id} className="rr-event-row">
                    <div className="rr-event-date">
                      {meetup.date}
                      <span>{meetup.edition || 'Meetup'}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="rr-event-title">{meetup.title}</h3>
                      <div className="rr-event-meta">
                        <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />{meetup.date}</span>
                        <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{meetup.time}</span>
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{meetup.venue}</span>
                      </div>
                    </div>
                    <div className="rr-event-actions">
                      <button type="button" className="rr-link" onClick={() => setSelectedMeetup(meetup)}>
                        Details
                      </button>
                      {canRegister ? (
                        <a
                          href={registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rr-btn"
                        >
                          RSVP free <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : (
                        <a
                          href={siteConfig.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rr-btn rr-btn--outline"
                        >
                          Ask on WhatsApp
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rr-empty mt-8">
              <Sparkles className="h-6 w-6 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
              <h3 className="rr-title rr-title--small mt-3">Next meetup coming soon.</h3>
              <p className="rr-lede mt-3">{t.gatherings.emptyUpcoming}</p>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rr-link mt-4"
              >
                Follow {siteConfig.instagramHandle} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* What happens */}
      <section className="rr-section rr-section--line" aria-label="What happens at a meetup">
        <div className="rr-container">
          <EditorialSectionHeading
            eyebrow="How it works"
            title="Bring a book. Stay for the people."
            description="Simple format, real connection. No gatekeeping, no performance — just reading in good company."
          />
          <div className="rr-principles">
            {[
              { num: '01', title: 'Show up', desc: 'Bring whatever you’re reading — novel, poetry, textbook, manga. All books belong here.', icon: BookOpen },
              { num: '02', title: 'Read together', desc: 'A quiet shared reading hour. Phones down, pages open, city noise fading out.', icon: Users },
              { num: '03', title: 'Talk if you want', desc: 'Share a line, a thought, or just listen. Conversations happen naturally after reading.', icon: MessageCircle },
              { num: '04', title: 'Come back', desc: 'The point isn’t one perfect meetup. It’s a rhythm: read, meet, repeat.', icon: Sparkles },
            ].map(({ num, title, desc, icon: Icon }) => (
              <article key={num} className="rr-principle">
                <span className="rr-principle__num">{num}</span>
                <Icon className="h-5 w-5 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                <h3 className="rr-title rr-title--small mt-5">{title}</h3>
                <p className="rr-body mt-3">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Spotlight */}
      <section className="rr-section rr-section--tight" aria-label="Featured gathering">
        <div className="rr-container">
          <UpcomingEventSpotlight
            key={nearestUpcomingMeetup?.id ?? nearestUpcomingMeetup?.startsAt ?? 'no-upcoming-meetup'}
            meetup={nearestUpcomingMeetup}
            announcement={announcementToShow}
            onViewEvent={(meetup) => setSelectedMeetup(meetup)}
            onViewAnnouncement={() => {
              if (announcementToShow) setFullAnnouncementId(announcementToShow.id);
            }}
            onViewGatherings={() => goTo('gatherings')}
          />
        </div>
      </section>

      {/* Reading desk */}
      <section className="rr-section rr-section--line" aria-label="From the reading desk">
        <div className="rr-container">
          <EditorialSectionHeading
            eyebrow="On the desk"
            title="What we're reading."
            description="Books moving through the circle — recommendations, notes, and things worth picking up."
          />
          <div className="rr-reading-desk">
            <FeaturedBookCard />
            <div className="rr-reading-list">
              <p className="rr-meta text-[color:var(--rr-terracotta)]">Also on the list</p>
              {readingList.map((book, index) => (
                <div key={book.id} className="rr-reading-list__item">
                  <span className="rr-reading-list__index">{String(index + 1).padStart(2, '0')}</span>
                  <BookOpen className="h-4 w-4 text-[color:var(--rr-brass)]" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-lg leading-tight">{book.title}</h3>
                    <p className="rr-body mt-0.5 text-xs">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Media */}
      <div className="rr-container rr-media-stack">
        <FeaturedAnnouncementReel />
        <ReelCollectionSection />
      </div>

      {/* Gallery */}
      <section className="rr-section rr-section--line" aria-label={t.community.galleryTitle}>
        <div className="rr-container">
          <EditorialSectionHeading
            eyebrow="Through the lens"
            title="Real moments. Real people."
            description="Photos from actual Readers of Aurangabad meetups — no stock, no staging."
            action={
              <button type="button" className="rr-link" onClick={() => goTo('community')}>
                Explore community <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            }
          />
          <div className="mt-8">
            <CommunityGallery compact />
          </div>
        </div>
      </section>

      {/* Voice / founder */}
      {memberVoices.length > 0 && (
        <section className="rr-section rr-section--line" aria-label="From the founder">
          <div className="rr-container">
            <EditorialSectionHeading eyebrow="From the founder" title="Why we keep showing up." />
            <div className="rr-voices mt-8">
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
      )}

      {/* Team */}
      {teamMembers.length > 0 && (
        <section className="rr-section rr-section--line" aria-label="The team">
          <div className="rr-container">
            <EditorialSectionHeading eyebrow="The people" title="The circle behind the collective." />
            <div className="rr-team-grid">
              {teamMembers.map((member) => (
                <article key={member.id} className="rr-person">
                  <div className="rr-person__photo">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} loading="lazy" />
                    ) : (
                      <Users className="h-8 w-8 text-[color:var(--rr-muted)]" aria-hidden="true" />
                    )}
                  </div>
                  <h3 className="rr-person__name">{member.name}</h3>
                  <p className="rr-person__role">{member.role}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <JoinSection />

      {/* Journal preview */}
      <section className="rr-section rr-section--line" aria-label={t.journal.heading}>
        <div className="rr-container">
          <EditorialSectionHeading
            eyebrow="Journal"
            title="Words from the community."
            description="Essays, reflections, poetry, and reading notes from Aurangabad and beyond."
            action={
              <button type="button" className="rr-link" onClick={() => goTo('journal')}>
                Browse all writing <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            }
          />
          <div className="rr-journal-grid">
            {featuredArticle && (
              <article
                className="rr-journal-feature"
                onClick={() => setSelectedArticle(featuredArticle)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedArticle(featuredArticle);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Read ${featuredArticle.title}`}
              >
                <div className="rr-journal-feature__image rr-image">
                  <img src={featuredArticle.coverImage} alt={featuredArticle.title} loading="lazy" />
                  <span className="rr-image-label">Featured</span>
                </div>
                <div className="rr-journal-feature__copy">
                  <p className="rr-meta text-[color:var(--rr-terracotta)]">
                    {featuredArticle.category} · {featuredArticle.readingTime} {t.journal.readTime}
                  </p>
                  <h3 className="rr-title rr-title--small mt-3">{featuredArticle.title}</h3>
                  <p className="rr-body mt-3">{featuredArticle.excerpt}</p>
                  <div className="rr-journal-feature__foot">
                    <span>By {featuredArticle.author}</span>
                    <span className="inline-flex items-center gap-1">
                      {t.journal.readArticle} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </article>
            )}

            <div className="rr-journal-list">
              {recentArticles
                .filter((article) => article.id !== featuredArticle?.id)
                .map((article) => (
                  <article
                    key={article.id}
                    className="rr-journal-item"
                    onClick={() => setSelectedArticle(article)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedArticle(article);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Read ${article.title}`}
                  >
                    <div className="rr-journal-item__thumb rr-image">
                      <img src={article.coverImage} alt="" loading="lazy" />
                    </div>
                    <div dir={article.language === 'ur' ? 'rtl' : 'ltr'} lang={article.language}>
                      <p className="rr-meta text-[color:var(--rr-terracotta)]">
                        {article.category} · {article.language.toUpperCase()}
                      </p>
                      <h4
                        className={`mt-1 font-display text-lg leading-tight ${
                          article.language === 'ur'
                            ? 'p4-urdu-card-heading font-urdu text-right leading-[2.1]'
                            : article.language === 'hi' || article.language === 'mr'
                              ? 'font-hindi leading-relaxed'
                              : ''
                        }`}
                      >
                        {article.title}
                      </h4>
                      <p className="rr-body mt-1 text-xs">
                        {article.author} · {article.readingTime} min
                      </p>
                    </div>
                  </article>
                ))}
              <button type="button" className="rr-journal-submit" onClick={() => goTo('contact')}>
                <span className="rr-meta text-[color:var(--rr-terracotta)]">Submit writing</span>
                <span className="mt-2 block font-display text-xl">Got something to say?</span>
                <span className="rr-body mt-2 block text-xs">
                  Reader stories, poems, essays, and critiques in English, Hindi, Urdu, and Marathi.
                </span>
                <span className="rr-link mt-3">Write to us <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rr-cta-band" aria-label="Join Readers of Aurangabad">
        <div className="rr-container rr-cta-band__inner">
          <div>
            <p className="rr-eyebrow rr-eyebrow--light">MH20 / Open to all</p>
            <h2 className="rr-cta-band__title">
              Read.<br />
              Meet.<br />
              Repeat.
            </h2>
            <p className="rr-cta-band__copy">
              No fees. No gatekeeping. Just books, people, and real conversations in Chhatrapati Sambhajinagar.
            </p>
          </div>
          <div className="rr-cta-band__actions">
            <button type="button" className="rr-btn rr-btn--brass" onClick={() => goTo('get-involved')}>
              Join the collective <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rr-btn rr-btn--light"
            >
              {siteConfig.instagramHandle}
            </a>
          </div>
        </div>
      </section>

      {/* Full announcement dialog */}
      {fullAnnouncement && (
        <motion.div
          className="rr-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismissFullAnnouncement}
        >
          <motion.div
            ref={fullAnnouncementSurfaceRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="full-announcement-title"
            tabIndex={-1}
            className="rr-modal rr-modal--news"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={dismissFullAnnouncement}
              aria-label="Close announcement"
              className="rr-modal__close"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="mb-6 pr-10">
              <p className="rr-eyebrow">Community announcement</p>
              <p className="rr-body mt-2 text-xs">
                Published{' '}
                {new Date(fullAnnouncement.publishedAt || fullAnnouncement.createdAt).toLocaleDateString(
                  'en-IN',
                  { day: 'numeric', month: 'long', year: 'numeric' },
                )}
              </p>
            </div>
            <h2 id="full-announcement-title" className="rr-title rr-title--compact">
              {fullAnnouncement.title}
            </h2>
            <div className="rr-modal__prose whitespace-pre-wrap break-words">{fullAnnouncement.content}</div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
