import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { siteConfig } from '../content/siteConfig';
import { ArrowRight, Compass, ExternalLink, Feather, Heart, MapPin, Sparkles, Users } from 'lucide-react';
import { scrollToTop } from '../utils/scroll';
import { Button, PageHero, PaperPanel, SectionHeading } from '../components/ui';

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
    text: 'Marathi, Urdu, Hindi, English â€” and every genre in between â€” sit side by side. No gatekeeping by language, title, or background.',
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
    <div className="paper-grain overflow-hidden pb-16">
      <PageHero
        image="/images/enhanced/gallery/roa-006-2026-11-05.webp"
        alt="Readers of Aurangabad gathered outdoors"
        eyebrow="The origin of the movement"
        title="Our Story"
        lead="Every movement begins with a simple thought â€” and ours began in the city of centuries."
      />

      <div className="space-y-12 sm:space-y-16">
        <section className="mx-auto max-w-4xl px-5 pt-10 text-center sm:px-8">
          <p className="font-serif text-lg italic leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6] sm:text-xl">
            In a city full of centuries-old stories, we wanted to create a space where people could discover
            the joy of reading together.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
          <PaperPanel className="rounded-none p-6 sm:p-10">
            <div className="space-y-7 font-serif text-base leading-[1.85] text-[#171717] dark:text-[#F4F0E8] sm:text-lg">
              <p className="text-xl font-bold leading-snug sm:text-2xl">
                Not another platform telling people which books to read. Not another community limited by
                genres or languages.
              </p>
              <p>
                Just a simple, enduring idea:{' '}
                <strong className="text-[#F4512C] dark:text-[#D9F36A]">
                  bring readers together, create meaningful real-world experiences, and make reading a part
                  of everyday life again.
                </strong>
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="border border-[#171717]/15 bg-[#F4F0E8] p-5 dark:border-[#F4F0E8]/15 dark:bg-[#171717]">
                  <span className="mb-2 block font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#F4512C] dark:text-[#D9F36A]">
                    The reality we saw
                  </span>
                  <p className="font-sans text-sm leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
                    Screens had colonised our free time, bookshops were thinning, and solitary readers had
                    nowhere to share their joy without commercial pressure or academic judgment.
                  </p>
                </div>
                <div className="border border-[#6E6960]/25 bg-[#F4F0E8] p-5 dark:border-[#8BA890]/25 dark:bg-[#171717]">
                  <span className="mb-2 block font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#6E6960] dark:text-[#B8B2A8]">
                    The sanctuary we built
                  </span>
                  <p className="font-sans text-sm leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
                    An open space under trees and across friendly venues where anyone can bring whatever
                    they are reading, sit quietly for an hour, and make an authentic human connection.
                  </p>
                </div>
              </div>
              <p>
                Aurangabad â€” Chhatrapati Sambhajinagar â€” has historically been a crossroads of civilisational
                dialogue. From the Buddhist rock-cut halls of Ajanta and Ellora to Sufi sanctuaries and modern
                educational institutions, this city understands reflection. Readers of Aurangabad (Readers of
                MH20) is an organic continuation of that legacy for our digital generation.
              </p>
              <p>
                We don&rsquo;t test your comprehension. We don&rsquo;t ask you to finish a book a week. We simply
                invite you to sit down, open a book, breathe, and belong.
              </p>
            </div>
          </PaperPanel>
        </section>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="What we stand for"
            title="Mission, vision, and values"
            description="A reading community built on welcome, curiosity, and the simple pleasure of being together."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {tenets.map((tenet) => {
              const Icon = tenet.icon;
              return (
                <article
                  key={tenet.title}
                  className="border border-[#171717]/20 bg-[#FFFCF5] p-6 dark:border-[#F4F0E8]/20 dark:bg-[#202020]"
                >
                  <span className="flex h-11 w-11 items-center justify-center border border-[#F4512C]/30 text-[#F4512C] dark:border-[#D9F36A]/40 dark:text-[#D9F36A]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold text-[#171717] dark:text-[#F4F0E8]">
                    {tenet.title}
                  </h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
                    {tenet.text}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
          <PaperPanel className="rounded-none p-6 sm:p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
              <div className="md:col-span-4">
                <img
                  src="/images/enhanced/community/founder-portrait.webp"
                  alt="Abdul Rafe Farooqui, founder of Readers of Aurangabad"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full border border-[#171717]/20 object-cover object-[center_15%] dark:border-[#F4F0E8]/20"
                />
                <h2 className="mt-4 font-display text-2xl font-bold text-[#171717] dark:text-[#F4F0E8]">
                  Abdul Rafe Farooqui
                </h2>
                <p className="mt-1 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#F4512C] dark:text-[#D9F36A]">
                  Founder, Readers of Aurangabad
                </p>
                <p className="mt-2 flex items-center gap-1.5 font-sans text-xs text-[#4F4A43] dark:text-[#D6D0C6]">
                  <MapPin className="h-3.5 w-3.5 text-[#6E6960] dark:text-[#B8B2A8]" aria-hidden="true" />
                  {siteConfig.locationLine}
                </p>
              </div>

              <div className="space-y-5 md:col-span-8">
                <p className="flex items-center gap-2 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#F4512C] dark:text-[#D9F36A]">
                  <Feather className="h-4 w-4" aria-hidden="true" />
                  From the founder&rsquo;s journal
                </p>
                <blockquote className="border-l-4 border-[#D9F36A] pl-5 font-serif text-lg italic leading-relaxed text-[#171717] dark:text-[#F4F0E8] sm:text-xl">
                  We are carving out a public sanctuary where a teenager reading manga sits beside a retired
                  schoolmaster reading Marathi prose, and where no one asks for credentials before welcoming
                  you to the circle.
                </blockquote>
                <p className="font-sans text-sm leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
                  Abdul Rafe started Readers of Aurangabad with a simple conviction: readers in the city did
                  not lack curiosity â€” they needed an unhurried, genuine space to gather. That belief continues
                  to shape every Sunday morning, every open book, and every conversation over chai.
                </p>
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 font-sans text-xs font-bold text-[#171717] underline underline-offset-4 hover:text-[#F4512C] dark:text-[#F4F0E8] dark:hover:text-[#D9F36A]"
                >
                  Follow {siteConfig.instagramHandle} on Instagram
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </PaperPanel>
        </section>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="Photographic chronicle"
            title="Moments that define the movement"
            description="Authentic snapshots from park lawns and public courtyards in Aurangabad."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {moments.map((moment) => (
              <article
                key={moment.title}
                className="border border-[#171717]/20 bg-[#FFFCF5] dark:border-[#F4F0E8]/20 dark:bg-[#202020]"
              >
                <img
                  src={moment.image}
                  alt={moment.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-56 w-full object-cover object-[center_25%] sm:h-64"
                />
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-[#171717] dark:text-[#F4F0E8]">
                    {moment.title}
                  </h3>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
                    {moment.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="code-of-conduct" className="mx-auto max-w-5xl scroll-mt-24 px-5 sm:px-8 lg:px-12">
          <PaperPanel className="rounded-none p-6 sm:p-10">
            <SectionHeading
              eyebrow="Community standards"
              title="Code of Conduct"
              description="How we look after one another so reading stays welcoming for everyone."
            />
            <ul className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {conduct.map((item) => (
                <li
                  key={item.title}
                  className="border border-[#171717]/15 bg-[#FFFCF5] p-5 dark:border-[#F4F0E8]/20 dark:bg-[#202020]"
                >
                  <h3 className="font-display text-base font-bold text-[#171717] dark:text-[#F4F0E8]">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </PaperPanel>
        </section>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <PaperPanel className="rounded-none p-6 sm:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#F4512C] dark:text-[#D9F36A]">
                  Community stewardship
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold text-[#171717] dark:text-[#F4F0E8]">
                  Run by readers
                </h2>
                <p className="mt-3 font-sans text-sm leading-relaxed text-[#4F4A43] dark:text-[#D6D0C6]">
                  Founder Abdul Rafe Farooqui anchors the vision. The rest is shaped by readers who bring a
                  book, a mat, a suggestion, or simply a willingness to help the circle feel welcome.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setCurrentPage('get-involved');
                  scrollToTop();
                }}
                className="shrink-0"
              >
                <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                Volunteer with us
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </PaperPanel>
        </section>
      </div>
    </div>
  );
};
