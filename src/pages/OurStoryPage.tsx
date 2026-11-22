import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { siteConfig } from '../content/siteConfig';
import { ArrowRight, Compass, ExternalLink, Feather, Heart, MapPin, Sparkles, Users } from 'lucide-react';
import { scrollToTop } from '../utils/scroll';
import { Button, PageHero, SectionHeading } from '../components/ui';

const tenets = [
  {
    icon: Compass,
    title: 'Our Mission',
    text: 'To revive reading as an unhurried, collective cultural habit in Aurangabad through accessible physical gatherings, an independent literary journal, and welcoming public reading spaces.',
  },
  {
    icon: Sparkles,
    title: 'Our Vision',
    text: 'A city where parks, gardens, and quiet corners are celebrated as shared reading spaces, where books travel between neighbourhoods, and where dialogue flourishes across four languages.',
  },
  {
    icon: Heart,
    title: 'Our Values',
    text: 'No elitism: manga and philosophy are welcome equally. No language hierarchies: Marathi, Urdu, Hindi, and English sit side by side. No performance: real paper, real presence, real conversation.',
  },
];

const moments = [
  {
    image: '/images/enhanced/community/community-banner-wide.webp',
    alt: 'Readers gathered quietly in a park in Aurangabad',
    title: 'The hour of silence',
    text: 'A full hour with notifications off, surrounded by trees and the sound of turning pages.',
  },
  {
    image: '/images/enhanced/community/card-1.webp',
    alt: 'A Readers of Aurangabad gathering near a historic landmark',
    title: 'Public spaces, shared',
    text: 'Literature returns to the streets, gardens, and courtyards that belong to everyone.',
  },
  {
    image: '/images/enhanced/hero/terrace-gathering-wide.webp',
    alt: 'Readers assembled together on a garden terrace',
    title: 'A reading family',
    text: 'Readers across languages and generations gather with no pretension and no gatekeeping.',
  },
];

const conduct = [
  {
    title: 'Quiet hours are shared hours',
    text: 'During silent reading, keep phones away and conversations low so everyone can settle into their book.',
  },
  {
    title: 'Every reader is welcome',
    text: 'Marathi, Urdu, Hindi, English — and every genre in between — sit side by side. No gatekeeping by language, title, or background.',
  },
  {
    title: 'Respect every viewpoint',
    text: 'Disagree with curiosity, never with contempt. Personal reflections stay voluntary and are shared only with permission.',
  },
  {
    title: 'No commercial promotion',
    text: 'Gatherings are non-commercial. Please do not use the circle to advertise products, services, or causes.',
  },
  {
    title: 'Privacy matters',
    text: 'Do not photograph or publish another reader without their consent. Stories and contact details are never shared publicly without permission.',
  },
  {
    title: 'Care for the space',
    text: 'Leave public venues as you found them and help make first-time visitors feel at ease.',
  },
];

export const OurStoryPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== '#code-of-conduct') return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      const target = document.getElementById('code-of-conduct');
      attempts += 1;
      if (target) {
        window.clearInterval(timer);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts > 20) {
        window.clearInterval(timer);
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rr-home">
      <PageHero
        image="/images/enhanced/gallery/roa-006-2026-11-05.webp"
        srcSet="/images/enhanced/mobile/roa-006-2026-11-05-mobile.webp 1080w, /images/enhanced/gallery/roa-006-2026-11-05.webp 2400w"
        sizes="100vw"
        imagePosition="object-[54%_42%] sm:object-[50%_36%] lg:object-[50%_46%]"
        alt="Readers of Aurangabad gathered outdoors"
        eyebrow="The origin of the movement"
        title="Our Story"
        lead="A simple idea in a city full of stories: make reading something people do together again."
      />

      {/* Prologue — a quiet, off-centre opening rather than a centred card. */}
      <section className="rr-section" aria-label="How the collective began">
        <div className="rr-container grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="rr-eyebrow">Prologue · MH20</p>
            <p className="rr-quote mt-8 lg:pr-6">
              In a city full of centuries-old stories, we wanted to create a space where people could discover the joy of reading together.
            </p>
          </div>
          <div className="border-t border-[color:var(--rr-border)] pt-8 lg:col-span-8 lg:border-l lg:border-t-0 lg:py-0 lg:pl-12">
            <div className="roa-prose max-w-[62ch]">
              <p className="text-xl font-semibold leading-snug sm:text-2xl">
                Not another platform telling people which books to read. Not another community limited by
                genres or languages.
              </p>
              <p>
                Just a simple, enduring idea:{' '}
                <strong className="text-[color:var(--rr-terracotta)]">
                  bring readers together, create meaningful real-world experiences, and make reading a part
                  of everyday life again.
                </strong>
              </p>
              <div className="my-8 grid gap-6 border-y border-[color:var(--rr-border)] py-7 sm:grid-cols-2 sm:gap-10">
                <div>
                  <p className="rr-meta text-[color:var(--rr-terracotta)]">The reality we saw</p>
                  <p className="rr-body mt-3">
                    Screens had colonised our free time, bookshops were thinning, and solitary readers had
                    nowhere to share their joy without commercial pressure or academic judgment.
                  </p>
                </div>
                <div>
                  <p className="rr-meta text-[color:var(--rr-terracotta)]">The sanctuary we built</p>
                  <p className="rr-body mt-3">
                    An open space under trees and across friendly venues where anyone can bring whatever
                    they are reading, sit quietly for an hour, and make an authentic human connection.
                  </p>
                </div>
              </div>
              <p>
                Aurangabad — Chhatrapati Sambhajinagar — has historically been a crossroads of civilisational
                dialogue. From the Buddhist rock-cut halls of Ajanta and Ellora to Sufi sanctuaries and modern
                educational institutions, this city understands reflection. Readers of Aurangabad (Readers of
                MH20) is an organic continuation of that legacy for our digital generation.
              </p>
              <p>
                We don&rsquo;t test your comprehension. We don&rsquo;t ask you to finish a book a week. We simply
                invite you to sit down, open a book, breathe, and belong.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What we stand for — ruled ledger, not a card grid. */}
      <section className="rr-section rr-section--line" aria-label="Mission, vision and values">
        <div className="rr-container">
          <SectionHeading
            eyebrow="What we stand for"
            title="Mission, vision, and values"
            description="A reading community built on welcome, curiosity, and the simple pleasure of being together."
          />
          <div className="mt-10 grid gap-px border border-[color:var(--rr-border)] bg-[color:var(--rr-border)] md:grid-cols-3">
            {tenets.map((tenet, index) => {
              const Icon = tenet.icon;
              return (
                <article key={tenet.title} className="bg-[color:var(--rr-paper)] p-7 sm:p-9">
                  <Icon className="h-5 w-5 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                  <p className="rr-meta mt-7 text-[color:var(--rr-muted)]">
                    {String(index + 1).padStart(2, '0')} / 03
                  </p>
                  <h3 className="rr-title rr-title--small mt-3">{tenet.title}</h3>
                  <p className="rr-body mt-4">{tenet.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founder — portrait opposite the founder's own words. */}
      <section className="rr-section rr-section--line" aria-label="From the founder">
        <div className="rr-container grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="rr-image aspect-[4/5] w-full">
              <img
                src="/images/community/founder-abdul-rafe-2026.jpeg"
                alt="Abdul Rafe Farooqui, founder of Readers of Aurangabad"
                loading="lazy"
                decoding="async"
                className="object-[center_15%]"
              />
              <span className="rr-image-label">The founder · {siteConfig.establishedYear}</span>
            </div>
            <h2 className="rr-title rr-title--small mt-6">Abdul Rafe Farooqui</h2>
            <p className="rr-meta mt-2 text-[color:var(--rr-terracotta)]">Founder, Readers of Aurangabad</p>
            <p className="rr-body mt-3 flex items-center gap-2 text-xs">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {siteConfig.locationLine}
            </p>
          </div>
          <div className="lg:col-span-7 lg:pl-8">
            <p className="rr-eyebrow">
              <Feather className="h-3.5 w-3.5" aria-hidden="true" />
              From the founder&rsquo;s journal
            </p>
            <blockquote className="rr-quote mt-8">
              We are carving out a public sanctuary where a teenager reading manga sits beside a retired
              schoolmaster reading Marathi prose, and where no one asks for credentials before welcoming
              you to the circle.
            </blockquote>
            <p className="rr-body mt-8 max-w-[58ch]">
              Abdul Rafe started Readers of Aurangabad with a simple conviction: readers in the city did
              not lack curiosity — they needed an unhurried, genuine space to gather. That belief continues
              to shape every gathering, every open book, and every conversation over chai.
            </p>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rr-link mt-8"
            >
              Follow {siteConfig.instagramHandle} on Instagram
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Photographic chronicle — an asymmetric photo essay. */}
      <section className="rr-section rr-section--line" aria-label="Photographic chronicle">
        <div className="rr-container">
          <SectionHeading
            eyebrow="Photographic chronicle"
            title="Moments that define the movement"
            description="Authentic snapshots from park lawns and public courtyards in Aurangabad."
          />
          <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
            {moments.map((moment, index) => (
              <figure
                key={moment.title}
                className={`${index === 0 ? 'lg:col-span-7' : 'lg:col-span-5'} min-w-0`}
              >
                <div className={`rr-image ${index === 0 ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
                  <img
                    src={moment.image}
                    alt={moment.alt}
                    loading="lazy"
                    decoding="async"
                    className="object-[center_25%]"
                  />
                </div>
                <figcaption className="mt-5 border-t border-[color:var(--rr-border)] pt-4">
                  <p className="rr-meta text-[color:var(--rr-terracotta)]">
                    {String(index + 1).padStart(2, '0')} · From the archive
                  </p>
                  <h3 className="rr-title rr-title--small mt-2">{moment.title}</h3>
                  <p className="rr-body mt-2 text-sm">{moment.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Code of conduct — the stable deep-link target is preserved. */}
      <section
        id="code-of-conduct"
        className="rr-section rr-section--line scroll-mt-24"
        aria-label="Code of Conduct"
      >
        <div className="rr-container">
          <SectionHeading
            eyebrow="Community standards"
            title="Code of Conduct"
            description="How we look after one another so reading stays welcoming for everyone."
          />
          <ul className="mt-10 grid gap-x-12 md:grid-cols-2">
            {conduct.map((item, index) => (
              <li
                key={item.title}
                className="border-t border-[color:var(--rr-border)] py-6"
              >
                <p className="rr-meta text-[color:var(--rr-brass)]">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="rr-title rr-title--small mt-3">{item.title}</h3>
                <p className="rr-body mt-2 text-sm">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Stewardship — closing forest invitation. */}
      <section className="rr-cta-band" aria-label="Run by readers">
        <div className="rr-container rr-cta-band__inner">
          <div>
            <p className="rr-eyebrow rr-eyebrow--light">Community stewardship</p>
            <h2 className="rr-cta-band__title">Run by readers</h2>
            <p className="rr-cta-band__copy">
              Founder Abdul Rafe Farooqui anchors the vision. The rest is shaped by readers who bring a
              book, a mat, a suggestion, or simply a willingness to help the circle feel welcome.
            </p>
          </div>
          <div className="rr-cta-band__actions">
            <Button
              type="button"
              onClick={() => {
                setCurrentPage('get-involved');
                scrollToTop();
              }}
              variant="outline-marigold"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Volunteer with us
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
