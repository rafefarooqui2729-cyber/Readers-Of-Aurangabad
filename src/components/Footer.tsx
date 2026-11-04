import React from 'react';
import { useApp } from '../context/AppContext';
import type { PageRoute } from '../types';
import { BookOpen, MapPin, ArrowUpRight } from 'lucide-react';
import { InstagramIcon } from './Icons';

export const Footer: React.FC = () => {
  const { t, setCurrentPage } = useApp();

  const handleNav = (page: PageRoute) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1C1B1A] text-[#FAF8F5] pt-16 pb-12 border-t border-[#363330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#363330]">
          
          {/* Brand & Mission Statement (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#1C1B1A]">
                <BookOpen className="w-5 h-5 text-[#455240]" />
              </div>
              <div>
                <span className="block font-serif text-2xl font-bold tracking-tight text-[#FAF8F5]">
                  Readers of Aurangabad
                </span>
                <span className="block text-xs font-sans font-medium tracking-widest text-[#B88B4A] uppercase">
                  Readers of MH20 • Est. 2026
                </span>
              </div>
            </div>

            <p className="font-serif italic text-lg text-[#E8E2D5]">
              "{t.footer.tagline}"
            </p>

            <p className="text-sm text-[#B4ADA2] leading-relaxed max-w-md">
              {t.footer.mission}
            </p>

            {/* Location & Instagram Badge */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://instagram.com/readers.of.aurangabad"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2A2826] hover:bg-[#8D5B4C] text-[#FAF8F5] text-xs font-medium transition-colors border border-[#363330]"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-[#E8E2D5]" />
                <span>@readers.of.aurangabad</span>
                <ArrowUpRight className="w-3 h-3 text-[#B4ADA2]" />
              </a>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2A2826] text-[#B4ADA2] text-xs border border-[#363330]">
                <MapPin className="w-3.5 h-3.5 text-[#B88B4A]" />
                <span>Aurangabad (MH20), Maharashtra</span>
              </div>
            </div>
          </div>

          {/* Navigation Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-base font-semibold text-[#FAF8F5] tracking-wide uppercase text-xs">
              Explore Movement
            </h4>
            <ul className="space-y-2 text-sm text-[#B4ADA2]">
              <li>
                <button onClick={() => handleNav('home')} className="hover:text-white transition-colors">
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('story')} className="hover:text-white transition-colors">
                  {t.nav.story}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('gatherings')} className="hover:text-white transition-colors">
                  {t.nav.gatherings}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('journal')} className="hover:text-white transition-colors">
                  {t.nav.journal}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('community')} className="hover:text-white transition-colors">
                  {t.nav.community}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('get-involved')} className="hover:text-white transition-colors">
                  {t.nav.getInvolved}
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('contact')} className="hover:text-white transition-colors">
                  {t.nav.contact}
                </button>
              </li>
            </ul>
          </div>

          {/* Philosophy Principles (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="font-serif text-base font-semibold text-[#FAF8F5] tracking-wide uppercase text-xs">
              Our Core Creed
            </h4>
            <ul className="space-y-2 text-xs text-[#B4ADA2] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#B88B4A] font-serif">•</span>
                <span>Reading has no boundaries of language or mother tongue.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B88B4A] font-serif">•</span>
                <span>Reading has no boundaries of religion or age.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B88B4A] font-serif">•</span>
                <span>Every genre deserves a dignified place.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B88B4A] font-serif">•</span>
                <span>Physical books and real-world connections matter.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B88B4A] font-serif">•</span>
                <span>Every reader carries an untold story worth listening to.</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={() => handleNav('admin')}
                className="text-xs text-[#8D5B4C] hover:text-[#B88B4A] flex items-center gap-1 transition-colors"
              >
                <span>Admin Login & Content Portal</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C857B] gap-4">
          <p>
            © {new Date().getFullYear()} Readers of Aurangabad (Readers of MH20). {t.footer.rights}
          </p>
          <div className="flex items-center gap-1 text-[#8C857B]">
            <span>Crafted with devotion for readers of</span>
            <span className="text-[#FAF8F5] font-medium">Aurangabad (Chhatrapati Sambhajinagar)</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
