import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Language, PageRoute } from '../types';
import { Menu, X, Globe, Lock, ShieldCheck, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { scrollToTop } from '../utils/scroll';
import { MemberNotificationCenter } from './MemberNotificationCenter';
import { MemberSignInModal } from './MemberSignInModal';
import { ThemeToggle } from './ui/ThemeToggle';

export const Navbar: React.FC = () => {
  const {
    lang, setLang, isRTL, currentPage, setCurrentPage, t,
    isAdmin, isMember, currentUserId,
    navigateToAnnouncement,
    memberNotifications, unreadNotificationCount, notificationsLoading,
    loginMember, requestMemberMagicLink, logoutMember, logoutAdmin,
    requestPasswordReset,
    markNotificationRead, markAllNotificationsRead,
  } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [memberSignInOpen, setMemberSignInOpen] = useState(false);
  const isAuthenticated = Boolean(currentUserId);

  const navLinks: { key: PageRoute; label: string }[] = [
    { key: 'gatherings', label: t.nav.gatherings },
    { key: 'community', label: t.nav.community },
    { key: 'journal', label: t.nav.journal },
    { key: 'story', label: t.nav.story },
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
    scrollToTop();
  };

  const handleLanguageSelect = (code: Language) => {
    setLang(code);
    setLangDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-[#171717] bg-[#F4F0E8]/96 dark:bg-[#171717]/96 backdrop-blur-sm dark:border-[#D9F36A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[76px] items-center justify-between gap-3">
          <button
            onClick={() => handleNavClick('home')}
            className="group flex min-w-0 items-center gap-3 text-left cursor-pointer"
            aria-label="Readers of Aurangabad Home"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#171717] bg-[#FFFCF5] p-0.5 shadow-[3px_3px_0_#171717] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:shadow-[3px_3px_0_#000]">
              <img
                src="/brand/logo.png"
                alt="Readers of Aurangabad logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-display text-[1.05rem] uppercase leading-none tracking-[-0.02em] text-[#171717] dark:text-[#F4F0E8] sm:text-[1.2rem]">
                Readers of Aurangabad
              </span>
              <span className="mt-1 block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4512C]">
                MH20 · Reading Movement
              </span>
            </div>
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = currentPage === link.key;
              return (
                <button
                  key={link.key}
                  onClick={() => handleNavClick(link.key)}
                  className={`relative min-h-[44px] px-3 py-2 font-sans text-xs font-bold uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#171717] dark:text-[#F4F0E8]'
                      : 'text-[#4F4A43] hover:text-[#171717] dark:text-[#B8B2A8] dark:hover:text-[#F4F0E8]'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2 bottom-1 h-[3px] bg-[#F4512C]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex min-h-[44px] items-center gap-1.5 border-2 border-[#171717] bg-[#FFFCF5] px-3 py-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#171717] shadow-[3px_3px_0_#171717] hover:bg-[#D9F36A] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8] dark:shadow-[3px_3px_0_#000] cursor-pointer"
                title="Change language"
                aria-label="Select language"
                aria-expanded={langDropdownOpen}
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{lang}</span>
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute mt-2 w-40 border-2 border-[#171717] bg-[#FFFCF5] p-1 shadow-[6px_6px_0_#171717] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:shadow-[6px_6px_0_#000] z-50 ${isRTL ? 'left-0' : 'right-0'}`}
                  >
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => handleLanguageSelect(l.code)}
                        className={`flex w-full min-h-[40px] items-center justify-between px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                          lang === l.code
                            ? 'bg-[#171717] text-[#F4F0E8]'
                            : 'text-[#171717] hover:bg-[#D9F36A] dark:text-[#F4F0E8] dark:hover:bg-[#D9F36A] dark:hover:text-[#171717]'
                        }`}
                      >
                        <span>{l.nativeName}</span>
                        <span className="font-mono text-[10px] uppercase opacity-70">{l.code}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <MemberNotificationCenter
              isMember={isMember}
              isAuthenticated={isAuthenticated}
              notifications={memberNotifications}
              unreadCount={unreadNotificationCount}
              loading={notificationsLoading}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
              onNavigateToAnnouncement={navigateToAnnouncement}
              onNavigate={(url) => {
                if (url === '/gatherings') handleNavClick('gatherings');
                else handleNavClick('home');
              }}
              onOpenSignIn={() => setMemberSignInOpen(true)}
            />

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => { void (isAdmin ? logoutAdmin() : logoutMember()); }}
                className="flex min-h-[44px] items-center gap-1.5 border-2 border-[#171717] bg-[#FFFCF5] px-3 py-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#171717] shadow-[3px_3px_0_#171717] hover:bg-[#D9F36A] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8] dark:shadow-[3px_3px_0_#000] cursor-pointer"
                title="Signed in"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMemberSignInOpen(true)}
                className="flex min-h-[44px] items-center gap-1.5 border-2 border-[#171717] bg-[#FFFCF5] px-3 py-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#171717] shadow-[3px_3px_0_#171717] hover:bg-[#D9F36A] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8] dark:shadow-[3px_3px_0_#000] cursor-pointer"
              >
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Member</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavClick('admin')}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center border-2 transition-colors cursor-pointer ${
                currentPage === 'admin'
                  ? 'border-[#171717] bg-[#171717] text-[#F4F0E8]'
                  : isAdmin
                  ? 'border-[#171717] bg-[#D9F36A] text-[#171717]'
                  : 'border-[#171717] bg-[#FFFCF5] text-[#171717] hover:bg-[#D9F36A] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8]'
              }`}
              title={isAdmin ? 'Admin Portal (Authenticated)' : 'Admin Portal'}
              aria-label="Admin Portal"
            >
              {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className="flex min-h-[44px] items-center justify-center border-2 border-[#171717] bg-[#F4512C] px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.1em] text-white shadow-[4px_4px_0_#171717] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_#171717] cursor-pointer"
            >
              {t.nav.joinCommunity}
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <MemberNotificationCenter
              isMember={isMember}
              isAuthenticated={isAuthenticated}
              notifications={memberNotifications}
              unreadCount={unreadNotificationCount}
              loading={notificationsLoading}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
              onNavigateToAnnouncement={navigateToAnnouncement}
              onNavigate={(url) => {
                if (url === '/gatherings') handleNavClick('gatherings');
                else handleNavClick('home');
              }}
              onOpenSignIn={() => setMemberSignInOpen(true)}
            />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center border-2 border-[#171717] bg-[#FFFCF5] text-[#171717] shadow-[3px_3px_0_#171717] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8] dark:shadow-[3px_3px_0_#000]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.1 : 0.22, ease: 'easeInOut' }}
              className="overflow-hidden border-t-2 border-[#171717] py-5 dark:border-[#F4F0E8]/25 lg:hidden"
            >
              <nav className="flex flex-col gap-2" aria-label="Mobile Navigation">
                {navLinks.map((link) => (
                  <button
                    key={link.key}
                    type="button"
                    onClick={() => handleNavClick(link.key)}
                    className={`min-h-[48px] w-full border-2 px-4 py-3 text-left font-display text-xl uppercase tracking-[-0.01em] transition-colors ${
                      currentPage === link.key
                        ? 'border-[#171717] bg-[#171717] text-[#F4F0E8]'
                        : 'border-[#171717] bg-[#FFFCF5] text-[#171717] hover:bg-[#D9F36A] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8]'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              <div className="mt-5 border-t-2 border-[#171717]/20 pt-4 dark:border-[#F4F0E8]/20">
                <span className="mb-2 block px-1 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-[#6E6960] dark:text-[#B8B2A8]">
                  Language
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleLanguageSelect(l.code)}
                      className={`min-h-[44px] border-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] ${
                        lang === l.code
                          ? 'border-[#171717] bg-[#F4512C] text-white'
                          : 'border-[#171717] bg-[#FFFCF5] text-[#171717] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8]'
                      }`}
                    >
                      {l.nativeName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => handleNavClick('contact')}
                  className="flex min-h-[48px] w-full items-center justify-center border-2 border-[#171717] bg-[#F4512C] font-sans text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#171717]"
                >
                  {t.nav.joinCommunity}
                </button>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isAdmin) void logoutAdmin();
                      else void logoutMember();
                      setMobileMenuOpen(false);
                    }}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 border-2 border-[#171717] bg-[#FFFCF5] font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#171717] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberSignInOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 border-2 border-[#171717] bg-[#FFFCF5] font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#171717] dark:border-[#F4F0E8]/35 dark:bg-[#202020] dark:text-[#F4F0E8]"
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span>Member sign in</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleNavClick('admin')}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[#4F4A43] underline underline-offset-4 dark:text-[#B8B2A8]"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.nav.admin}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MemberSignInModal
        open={memberSignInOpen}
        onClose={() => setMemberSignInOpen(false)}
        onPasswordSignIn={loginMember}
        onMagicLink={requestMemberMagicLink}
        onForgotPassword={requestPasswordReset}
      />
    </header>
  );
};
