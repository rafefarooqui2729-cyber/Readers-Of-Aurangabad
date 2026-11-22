import React from 'react';
import { useApp } from '../context/AppContext';
import type { PageRoute } from '../types';
import { MapPin, Mail, MessageCircle, ArrowUpRight } from 'lucide-react';
import { InstagramIcon } from './Icons';
import { scrollToTop } from '../utils/scroll';
import { Stamp } from './ui/Stamp';
import { siteConfig } from '../content/siteConfig';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  const { setCurrentPage, t } = useApp();

  const handleNav = (page: PageRoute) => {
    setCurrentPage(page);
    scrollToTop();
  };

  const handleCodeOfConduct = () => {
    setCurrentPage('story');
    scrollToTop();
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
  };

  return (
    <footer className="border-t border-[color:var(--rr-border)] bg-[color:var(--rr-dark)] text-[color:var(--rr-on-dark)]">
      <div className="rr-container">
        <div className="grid grid-cols-1 gap-10 border-b border-[color:var(--rr-border)] py-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-0">
          <div className="space-y-7 lg:col-span-5 lg:border-r lg:border-[color:var(--rr-border)] lg:pr-10">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[color:var(--rr-brass)] bg-[color:var(--rr-paper)] p-1">
                <img
                  src="/brand/logo.png"
                  alt="Readers of Aurangabad"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="block">
                <span className="block font-display text-2xl uppercase leading-none tracking-[-0.02em]">
                  Readers of Aurangabad
                </span>
                <span className="rr-meta mt-2 block text-[color:var(--rr-brass)]">
                  MH20 · City Reading Collective
                </span>
              </span>
            </div>

            <p className="max-w-md border-l border-[color:var(--rr-brass)] pl-5 font-display text-lg italic leading-relaxed text-[color:var(--rr-on-dark)]/85">
              Real books, real people, real conversations — across Marathi, Urdu, Hindi, and English in Chhatrapati Sambhajinagar.
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rr-touch inline-flex items-center gap-2 text-[color:var(--rr-on-dark)]/85 transition-colors hover:text-[color:var(--rr-brass)]"
              >
                <InstagramIcon className="h-4 w-4" />
                <span className="rr-meta">{siteConfig.instagramHandle}</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rr-touch inline-flex items-center gap-2 text-[color:var(--rr-on-dark)]/85 transition-colors hover:text-[color:var(--rr-brass)]"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="rr-meta">WhatsApp Group</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <a
                href={`mailto:${siteConfig.email}`}
                className="rr-touch inline-flex items-center gap-2 text-[color:var(--rr-on-dark)]/85 transition-colors hover:text-[color:var(--rr-brass)]"
              >
                <Mail className="h-4 w-4" />
                <span className="rr-meta">{siteConfig.email}</span>
              </a>
            </div>

            <p className="rr-meta flex items-center gap-2 text-[color:var(--rr-on-dark)]/60">
              <MapPin className="h-3.5 w-3.5 text-[color:var(--rr-brass)]" aria-hidden="true" />
              {siteConfig.locationLine}
            </p>
          </div>

          <div className="lg:col-span-3 lg:border-r lg:border-[color:var(--rr-border)] lg:px-8">
            <h3 className="rr-meta mb-5 text-[color:var(--rr-brass)]">
              Explore
            </h3>
            <ul className="border-t border-[color:var(--rr-border)]">
              {[
                { key: 'home' as PageRoute, label: t.nav.home },
                { key: 'gatherings' as PageRoute, label: t.nav.gatherings },
                { key: 'community' as PageRoute, label: 'Readers & Stories' },
                { key: 'journal' as PageRoute, label: t.nav.journal },
                { key: 'story' as PageRoute, label: t.nav.story },
                { key: 'get-involved' as PageRoute, label: t.nav.getInvolved },
              ].map((item) => (
                <li key={item.key} className="border-b border-[color:var(--rr-border)]">
                  <button
                    type="button"
                    onClick={() => handleNav(item.key)}
                    className="rr-touch inline-flex min-w-[44px] items-center py-1 text-left text-sm text-[color:var(--rr-on-dark)]/80 transition-colors hover:text-[color:var(--rr-brass)] cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li className="border-b border-[color:var(--rr-border)]">
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className="rr-touch inline-flex min-w-[44px] items-center gap-1.5 py-1 text-left text-sm font-bold text-[color:var(--rr-brass)] transition-colors hover:text-[color:var(--rr-on-dark)] cursor-pointer"
                >
                  <span>{t.nav.admin}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-8 lg:col-span-4 lg:pl-10">
            <div className="[&_.rr-imprint__meta]:text-[color:var(--rr-brass)] [&_.rr-imprint__name]:text-[color:var(--rr-on-dark)] [&_.rr-imprint__rule]:bg-[color:var(--rr-brass)] [&_.rr-imprint__year]:text-[color:var(--rr-brass)]">
              <Stamp year={siteConfig.establishedYear} size="md" />
            </div>

            <div className="border-t border-[color:var(--rr-border)] pt-6">
              <h3 className="rr-meta text-[color:var(--rr-brass)]">
                Community standards
              </h3>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-[color:var(--rr-on-dark)]/70">
                Quiet hours during reading, respect across languages and viewpoints, no commercial promotion or gatekeeping.
              </p>
              <a
                href={siteConfig.footer.codeOfConductUrl}
                onClick={(e) => {
                  if (
                    e.defaultPrevented ||
                    e.button !== 0 ||
                    e.metaKey ||
                    e.ctrlKey ||
                    e.shiftKey ||
                    e.altKey
                  ) {
                    return;
                  }
                  e.preventDefault();
                  handleCodeOfConduct();
                }}
                className="rr-touch mt-3 inline-flex items-center border-b border-[color:var(--rr-brass)] text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--rr-brass)] transition-colors hover:text-[color:var(--rr-on-dark)]"
              >
                Read our Code of Conduct →
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 py-7 text-xs text-[color:var(--rr-on-dark)]/60 sm:flex-row sm:items-center">
          <p>
            © {CURRENT_YEAR} Readers of Aurangabad (MH20). {siteConfig.footer.copyrightText}
          </p>
          <p className="text-[color:var(--rr-on-dark)]/80">
            Grounded in{' '}
            <span className="font-bold text-[color:var(--rr-brass)]">
              Aurangabad (Chhatrapati Sambhajinagar), Maharashtra
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};
