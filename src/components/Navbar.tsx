import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Language, PageRoute } from '../types';
import { BookOpen, Menu, X, Globe, Lock, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { lang, setLang, t, isRTL, currentPage, setCurrentPage, isAdmin } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const navLinks: { key: PageRoute; label: string }[] = [
    { key: 'home', label: t.nav.home },
    { key: 'story', label: t.nav.story },
    { key: 'gatherings', label: t.nav.gatherings },
    { key: 'journal', label: t.nav.journal },
    { key: 'community', label: t.nav.community },
    { key: 'get-involved', label: t.nav.getInvolved },
    { key: 'contact', label: t.nav.contact },
  ];

  const languages: { code: Language; label: string; nativeName: string }[] = [
    { code: 'en', label: 'English', nativeName: 'English' },
    { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'ur', label: 'Urdu', nativeName: 'اردو' },
    { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
  ];

  const handleNavClick = (page: PageRoute) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLanguageSelect = (code: Language) => {
    setLang(code);
    setLangDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E2D5] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <button 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left focus:outline-none group"
            aria-label="Readers of Aurangabad Home"
          >
            <div className="w-11 h-11 rounded-full bg-[#1C1B1A] flex items-center justify-center text-[#FAF8F5] shadow-sm group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-[#E8E2D5]" />
            </div>
            <div>
              <span className="block font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#1C1B1A] leading-tight">
                Readers of Aurangabad
              </span>
              <span className="block text-[11px] font-sans font-medium tracking-widest uppercase text-[#8D5B4C]">
                MH20 Literary Movement
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = currentPage === link.key;
              return (
                <button
                  key={link.key}
                  onClick={() => handleNavClick(link.key)}
                  className={`text-sm font-medium tracking-wide transition-colors py-1 editorial-link ${
                    isActive 
                      ? 'text-[#1C1B1A] font-semibold after:scale-x-100' 
                      : 'text-[#595550] hover:text-[#1C1B1A]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster: Language Switcher, Admin Button, CTA */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#1C1B1A] hover:bg-[#E8E2D5]/60 transition-colors border border-[#E8E2D5]"
                title="Change Language"
                aria-label="Select language"
              >
                <Globe className="w-3.5 h-3.5 text-[#455240]" />
                <span className="uppercase tracking-wider font-semibold">{lang}</span>
                <span className="text-[#8D5B4C]">
                  {languages.find(l => l.code === lang)?.nativeName}
                </span>
              </button>

              {langDropdownOpen && (
                <div 
                  className={`absolute mt-2 w-36 bg-white border border-[#E8E2D5] rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleLanguageSelect(l.code)}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors ${
                        lang === l.code 
                          ? 'bg-[#F4EFEA] text-[#1C1B1A] font-bold' 
                          : 'text-[#595550] hover:bg-[#FAF8F5] hover:text-[#1C1B1A]'
                      }`}
                    >
                      <span>{l.nativeName}</span>
                      <span className="text-[10px] text-[#8D5B4C] uppercase">{l.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Portal Quick Icon */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`p-2 rounded-full border transition-all ${
                currentPage === 'admin'
                  ? 'bg-[#1C1B1A] text-white border-[#1C1B1A]'
                  : isAdmin
                  ? 'bg-[#EBF0E9] text-[#455240] border-[#455240]/30 hover:bg-[#455240] hover:text-white'
                  : 'text-[#595550] border-transparent hover:border-[#E8E2D5] hover:text-[#1C1B1A]'
              }`}
              title={isAdmin ? "Admin Portal (Authenticated)" : "Admin Portal"}
              aria-label="Admin Portal"
            >
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => handleNavClick('get-involved')}
              className="bg-[#1C1B1A] hover:bg-[#455240] text-[#FAF8F5] px-5 py-2 rounded-full text-xs font-medium tracking-wider transition-all duration-300 shadow-sm hover:shadow"
            >
              {t.nav.joinCommunity}
            </button>
          </div>

          {/* Mobile Menu & Language Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#1C1B1A] border border-[#E8E2D5] flex items-center gap-1"
            >
              <Globe className="w-3 h-3 text-[#455240]" />
              <span className="uppercase">{lang}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1C1B1A] rounded-lg hover:bg-[#E8E2D5]/50 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Language Selector Dropdown */}
        {langDropdownOpen && (
          <div className="md:hidden py-2 px-3 border-t border-[#E8E2D5] bg-[#FAF8F5] grid grid-cols-4 gap-1.5">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLanguageSelect(l.code)}
                className={`py-1.5 px-2 rounded text-center text-xs font-medium border ${
                  lang === l.code
                    ? 'bg-[#1C1B1A] text-white border-[#1C1B1A]'
                    : 'bg-white text-[#595550] border-[#E8E2D5]'
                }`}
              >
                {l.nativeName}
              </button>
            ))}
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E8E2D5] py-4 space-y-1 bg-[#FAF8F5] animate-in fade-in slide-in-from-top-4 duration-200">
            {navLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => handleNavClick(link.key)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === link.key
                    ? 'bg-[#E8E2D5]/70 text-[#1C1B1A] font-semibold'
                    : 'text-[#595550] hover:bg-[#E8E2D5]/30 hover:text-[#1C1B1A]'
                }`}
              >
                {link.label}
              </button>
            ))}
            
            <div className="pt-3 px-3 flex flex-col gap-2">
              <button
                onClick={() => handleNavClick('get-involved')}
                className="w-full bg-[#1C1B1A] hover:bg-[#455240] text-[#FAF8F5] py-2.5 rounded-full text-center text-sm font-medium tracking-wide shadow-sm"
              >
                {t.nav.joinCommunity}
              </button>

              <button
                onClick={() => handleNavClick('admin')}
                className="w-full text-center py-2 text-xs text-[#595550] hover:text-[#1C1B1A] flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t.nav.admin}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
