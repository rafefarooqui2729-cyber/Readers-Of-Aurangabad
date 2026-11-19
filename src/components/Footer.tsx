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
    <footer className="relative overflow-hidden border-t-[3px] border-[#171717] bg-[#171717] pb-12 pt-14 text-[#F4F0E8] dark:border-[#D9F36A]">
      <div className="absolute left-0 top-0 h-2 w-full bg-[#F4512C]" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 border-b-2 border-[#F4F0E8]/20 pb-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 border-2 border-[#F4F0E8] bg-[#F4F0E8] p-0.5">
                <img
                  src="/brand/logo.png"
                  alt="Readers of Aurangabad"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <span className="block font-display text-2xl uppercase leading-none tracking-[-0.02em] text-[#F4F0E8]">
                  Readers of Aurangabad
                </span>
                <span className="mt-1 block font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9F36A]">
                  MH20 · Local Reading Movement
                </span>
              </div>
            </div>

            <p className="max-w-md border-l-4 border-[#F4512C] pl-4 font-serif text-lg italic leading-relaxed text-[#F4F0E8]/92">
              Quiet mornings, physical books, open courtyards, and conversations across Marathi, Urdu, Hindi, and English in Aurangabad.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 border-2 border-[#F4F0E8] bg-transparent px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#F4F0E8] transition-colors hover:bg-[#D9F36A] hover:text-[#171717]"
              >
                <InstagramIcon className="h-4 w-4" />
                <span>{siteConfig.instagramHandle}</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 border-2 border-[#F4F0E8] bg-transparent px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#F4F0E8] transition-colors hover:bg-[#D9F36A] hover:text-[#171717]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Group</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex min-h-[44px] items-center gap-2 border-2 border-[#F4F0E8] bg-transparent px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#F4F0E8] transition-colors hover:bg-[#D9F36A] hover:text-[#171717]"
              >
                <Mail className="h-4 w-4" />
                <span>{siteConfig.email}</span>
              </a>

              <div className="inline-flex min-h-[44px] items-center gap-1.5 border-2 border-[#F4F0E8]/50 px-4 py-2 font-sans text-xs font-medium text-[#F4F0E8]/85">
                <MapPin className="h-4 w-4 text-[#D9F36A]" />
                <span>{siteConfig.locationLine}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#D9F36A]">
              Navigation
            </h3>
            <ul className="space-y-2 font-sans text-sm">
              {[
                { key: 'home' as PageRoute, label: t.nav.home },
                { key: 'gatherings' as PageRoute, label: t.nav.gatherings },
                { key: 'community' as PageRoute, label: 'Readers & Stories' },
                { key: 'journal' as PageRoute, label: t.nav.journal },
                { key: 'story' as PageRoute, label: t.nav.story },
                { key: 'contact' as PageRoute, label: t.nav.getInvolved },
              ].map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => handleNav(item.key)}
                    className="min-h-[32px] py-1 text-left text-[#F4F0E8]/85 transition-colors hover:text-[#D9F36A] hover:underline underline-offset-4 cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className="inline-flex min-h-[32px] items-center gap-1 py-1 text-left font-bold text-[#D9F36A] hover:underline underline-offset-4 cursor-pointer"
                >
                  <span>{t.nav.admin}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-start justify-between space-y-6 sm:items-end lg:col-span-4">
            <Stamp year={siteConfig.establishedYear} size="md" className="!rotate-0 sm:!rotate-[-4deg]" />

            <div className="space-y-2 sm:text-right">
              <span className="block font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#F4512C]">
                Community standards
              </span>
              <p className="max-w-xs text-xs leading-relaxed text-[#F4F0E8]/75">
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
                className="inline-flex min-h-[24px] items-center font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#D9F36A] underline underline-offset-4"
              >
                Read our Code of Conduct →
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 font-sans text-xs text-[#F4F0E8]/70 sm:flex-row">
          <p>
            © {CURRENT_YEAR} Readers of Aurangabad (MH20). {siteConfig.footer.copyrightText}
          </p>
          <p className="text-[#F4F0E8]">
            Grounded in <span className="font-bold text-[#D9F36A]">Aurangabad (Chhatrapati Sambhajinagar), Maharashtra</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
