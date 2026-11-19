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

  // Navigate to Our Story, then scroll to the real Code of Conduct section once
  // the lazy-loaded page has mounted.
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
    <footer className="bg-[#1B2A49] text-[#F4ECDD] pt-16 pb-12 border-t-2 border-[#1B2A49] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#F4ECDD]/20 items-start">

          {/* Brand & Stamp (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[4px] border border-[#F4ECDD]/30 overflow-hidden bg-[#FFF8EA] p-0.5 shrink-0">
                <img
                  src="/brand/logo.png"
                  alt="Readers of Aurangabad"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <span className="block font-serif text-2xl font-bold tracking-tight text-[#F4ECDD]">
                  Readers of Aurangabad
                </span>
                <span className="block text-xs font-sans font-bold tracking-[0.2em] text-[#E8B04A] uppercase mt-0.5">
                  MH20 · A READING COMMUNITY
                </span>
              </div>
            </div>

            <p className="font-serif italic text-lg text-[#F4ECDD]/90 leading-relaxed max-w-md">
              "We meet on quiet weekend mornings under trees and in open courtyards. Bring whatever book you are currently reading—Marathi, Urdu, Hindi, English—read in peaceful silence, and share chai and honest reflections."
            </p>

            {/* Social & Contact Links */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#243557] hover:bg-[#A8431F] text-[#F4ECDD] text-xs font-bold transition-colors border border-[#F4ECDD]/20 min-h-[44px]"
              >
                <InstagramIcon className="w-4 h-4 text-[#E8B04A]" />
                <span>{siteConfig.instagramHandle}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#F4ECDD]/70" />
              </a>

              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#243557] hover:bg-[#5E7A63] text-[#F4ECDD] text-xs font-bold transition-colors border border-[#F4ECDD]/20 min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4 text-[#5E7A63]" />
                <span>WhatsApp Group</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#F4ECDD]/70" />
              </a>

              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#243557] hover:bg-[#A8431F] text-[#F4ECDD] text-xs font-bold transition-colors border border-[#F4ECDD]/20 min-h-[44px]"
              >
                <Mail className="w-4 h-4 text-[#E8B04A]" />
                <span>{siteConfig.email}</span>
              </a>

              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-[#243557] text-[#D1C5B0] text-xs font-medium border border-[#F4ECDD]/20 min-h-[44px]">
                <MapPin className="w-4 h-4 text-[#E8B04A]" />
                <span>{siteConfig.locationLine}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E8B04A]">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm font-sans">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('home')}
                  className="text-[#F4ECDD]/80 hover:text-[#F4ECDD] hover:underline transition-colors cursor-pointer text-left py-1"
                >
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('gatherings')}
                  className="text-[#F4ECDD]/80 hover:text-[#F4ECDD] hover:underline transition-colors cursor-pointer text-left py-1"
                >
                  {t.nav.gatherings}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('community')}
                  className="text-[#F4ECDD]/80 hover:text-[#F4ECDD] hover:underline transition-colors cursor-pointer text-left py-1"
                >
                  Readers &amp; Stories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('journal')}
                  className="text-[#F4ECDD]/80 hover:text-[#F4ECDD] hover:underline transition-colors cursor-pointer text-left py-1"
                >
                  {t.nav.journal}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('story')}
                  className="text-[#F4ECDD]/80 hover:text-[#F4ECDD] hover:underline transition-colors cursor-pointer text-left py-1"
                >
                  {t.nav.story}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('contact')}
                  className="text-[#F4ECDD]/80 hover:text-[#F4ECDD] hover:underline transition-colors cursor-pointer text-left py-1"
                >
                  {t.nav.getInvolved}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className="text-[#E8B04A] hover:underline transition-colors cursor-pointer text-left py-1 flex items-center gap-1"
                >
                  <span>{t.nav.admin}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </li>
            </ul>
          </div>

          {/* Stamp & Code of Conduct (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-start sm:items-end justify-between space-y-6">
            <Stamp year={siteConfig.establishedYear} size="md" />

            <div className="sm:text-right space-y-2">
              <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#5E7A63] block">
                COMMUNITY STANDARDS
              </span>
              <p className="text-xs text-[#D1C5B0] max-w-xs leading-relaxed">
                Quiet hours during reading, respect across all languages and viewpoints, no commercial promotion or gatekeeping.
              </p>
              <a
                href={siteConfig.footer.codeOfConductUrl}
                onClick={(e) => {
                  // Keep SPA navigation + smooth in-page scroll for ordinary clicks.
                  // Modified clicks / new-tab intents keep native browser behavior.
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
                className="inline-flex min-h-[24px] items-center text-xs font-bold text-[#E8B04A] hover:underline pt-1"
              >
                Read our Code of Conduct →
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#D1C5B0] gap-4">
          <p>
            © {CURRENT_YEAR} Readers of Aurangabad (MH20). {siteConfig.footer.copyrightText}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#D1C5B0]">
            <span>Grounded in</span>
            <span className="text-[#F4ECDD] font-bold">Aurangabad (Chhatrapati Sambhajinagar), Maharashtra</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
