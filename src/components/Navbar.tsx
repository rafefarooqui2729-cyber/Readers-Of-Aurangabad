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

  // Navigation labels come from translations and point to the pages that
  // actually exist. The community route is Readers & Stories, not a book archive.
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
    <header
      className="sticky top-0 z-40 bg-[#F4ECDD] dark:bg-[#1B2A49] border-b border-[#1B2A49]/20 dark:border-[#384F7A] transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Wordmark in Fraunces bold */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[#A8431F] group cursor-pointer"
            aria-label="Readers of Aurangabad Home"
          >
            <div className="w-10 h-10 rounded-[4px] border border-[#1B2A49]/30 dark:border-[#F4ECDD]/30 overflow-hidden bg-[#FFF8EA] dark:bg-[#243557] flex items-center justify-center p-0.5">
              <img
                src="/brand/logo.png"
                alt="Readers of Aurangabad Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="block font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1B2A49] dark:text-[#F4ECDD] leading-none">
                Readers of Aurangabad
              </span>
              <span className="block text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-[#A8431F] mt-1">
                MH20 · A READING COMMUNITY
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links with Underline Slide */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = currentPage === link.key;
              return (
                <button
                  key={link.key}
                  onClick={() => handleNavClick(link.key)}
                  className={`relative text-base tracking-wide py-2 px-1 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A8431F] ${
                    isActive
                      ? 'text-[#1B2A49] dark:text-[#F4ECDD] font-bold'
                      : 'text-[#1B2A49]/70 dark:text-[#F4ECDD]/70 hover:text-[#1B2A49] dark:hover:text-[#F4ECDD] font-medium'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A8431F]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster: Theme, Language, Notifications, Auth, Join Us */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Theme Toggle (Dark / Light) */}
            <ThemeToggle />

            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-bold text-[#1B2A49] dark:text-[#F4ECDD] border border-[#1B2A49]/30 dark:border-[#F4ECDD]/30 hover:bg-[#1B2A49]/5 dark:hover:bg-[#F4ECDD]/10 transition-colors cursor-pointer min-h-[44px]"
                title="Change Language"
                aria-label="Select language"
              >
                <Globe className="w-3.5 h-3.5 text-[#5E7A63]" />
                <span className="uppercase tracking-wider">{lang}</span>
                <span className="text-[#A8431F]">
                  ({languages.find(l => l.code === lang)?.nativeName})
                </span>
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute mt-2 w-36 bg-[#FFF8EA] dark:bg-[#243557] border-2 border-[#1B2A49] dark:border-[#384F7A] rounded-[4px] shadow-md py-1 z-50 ${
                      isRTL ? 'left-0' : 'right-0'
                    }`}
                  >
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => handleLanguageSelect(l.code)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          lang === l.code
                            ? 'bg-[#A8431F] text-[#F4ECDD] font-bold'
                            : 'text-[#1B2A49] dark:text-[#F4ECDD] hover:bg-[#1B2A49]/10'
                        }`}
                      >
                        <span>{l.nativeName}</span>
                        <span className="text-[10px] uppercase font-mono">{l.code}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Center */}
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

            {/* Member Auth Button */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => { void (isAdmin ? logoutAdmin() : logoutMember()); }}
                className="px-3 py-2 rounded-[4px] border border-[#1B2A49]/30 dark:border-[#F4ECDD]/30 text-xs font-bold text-[#1B2A49] dark:text-[#F4ECDD] hover:bg-[#1B2A49]/5 dark:hover:bg-[#F4ECDD]/10 flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                title="Signed in"
              >
                <LogOut className="w-3.5 h-3.5 text-[#A8431F]" />
                <span>Sign out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMemberSignInOpen(true)}
                className="px-3 py-2 rounded-[4px] border border-[#1B2A49]/30 dark:border-[#F4ECDD]/30 text-xs font-bold text-[#1B2A49] dark:text-[#F4ECDD] hover:bg-[#1B2A49]/5 dark:hover:bg-[#F4ECDD]/10 flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <User className="w-3.5 h-3.5 text-[#5E7A63]" />
                <span>Member sign in</span>
              </button>
            )}

            {/* Admin Portal Shortcut */}
            <button
              type="button"
              onClick={() => handleNavClick('admin')}
              className={`p-2.5 rounded-[4px] border transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                currentPage === 'admin'
                  ? 'bg-[#1B2A49] text-[#F4ECDD] border-[#1B2A49]'
                  : isAdmin
                  ? 'border-[#5E7A63] text-[#5E7A63] hover:bg-[#5E7A63] hover:text-white'
                  : 'border-[#1B2A49]/30 dark:border-[#F4ECDD]/30 text-[#1B2A49]/70 dark:text-[#F4ECDD]/70 hover:text-[#1B2A49]'
              }`}
              title={isAdmin ? "Admin Portal (Authenticated)" : "Admin Portal"}
              aria-label="Admin Portal"
            >
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            </button>

            {/* Clay "Join Us" Button */}
            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className="bg-[#A8431F] text-[#F4ECDD] hover:bg-[#8F3717] active:bg-[#782E12] font-sans font-bold text-sm tracking-wide px-5 py-2.5 rounded-[4px] transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              {t.nav.joinCommunity}
            </button>
          </div>

          {/* Mobile Right Controls: Theme + Notifications + 44px Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
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
              className="min-h-[44px] min-w-[44px] p-2 text-[#1B2A49] dark:text-[#F4ECDD] rounded-[4px] border border-[#1B2A49]/30 dark:border-[#F4ECDD]/30 hover:bg-[#1B2A49]/5 transition-colors flex items-center justify-center"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Full-height Drawer Menu with Large Links */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.1 : 0.25, ease: 'easeInOut' }}
              className="lg:hidden border-t border-[#1B2A49]/20 dark:border-[#384F7A] py-6 px-2 space-y-3 bg-[#F4ECDD] dark:bg-[#1B2A49] overflow-hidden"
            >
              <nav className="flex flex-col space-y-2" aria-label="Mobile Navigation">
                {navLinks.map((link) => (
                  <button
                    key={link.key}
                    type="button"
                    onClick={() => handleNavClick(link.key)}
                    className={`w-full text-left px-4 py-3 rounded-[4px] font-serif text-2xl font-bold tracking-tight transition-colors ${
                      currentPage === link.key
                        ? 'bg-[#1B2A49] text-[#F4ECDD] dark:bg-[#FFF8EA] dark:text-[#1B2A49]'
                        : 'text-[#1B2A49] dark:text-[#F4ECDD] hover:bg-[#1B2A49]/10'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              {/* Language Switcher in Mobile Drawer */}
              <div className="pt-4 border-t border-[#1B2A49]/15 dark:border-[#384F7A]">
                <span className="text-xs font-bold uppercase tracking-widest text-[#5E7A63] block mb-2 px-4">
                  Select Language / भाषा / زبان
                </span>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleLanguageSelect(l.code)}
                      className={`min-h-[44px] py-2 px-3 rounded-[4px] text-xs font-bold border transition-colors flex items-center justify-between ${
                        lang === l.code
                          ? 'bg-[#A8431F] text-[#F4ECDD] border-[#A8431F]'
                          : 'bg-[#FFF8EA] dark:bg-[#243557] text-[#1B2A49] dark:text-[#F4ECDD] border-[#1B2A49]/20'
                      }`}
                    >
                      <span>{l.nativeName}</span>
                      <span className="opacity-70 font-mono text-[10px]">{l.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons in Mobile Drawer */}
              <div className="pt-4 px-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleNavClick('contact')}
                  className="w-full bg-[#A8431F] text-[#F4ECDD] hover:bg-[#8F3717] min-h-[48px] rounded-[4px] font-sans font-bold text-base tracking-wide flex items-center justify-center transition-colors"
                >
                  {t.nav.joinCommunity} (MH20)
                </button>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isAdmin) void logoutAdmin();
                      else void logoutMember();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] rounded-[4px] border border-[#1B2A49]/30 dark:border-[#F4ECDD]/30 text-xs font-bold text-[#1B2A49] dark:text-[#F4ECDD] flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-[#A8431F]" />
                    <span>Sign out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberSignInOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] rounded-[4px] border border-[#1B2A49]/30 dark:border-[#F4ECDD]/30 text-xs font-bold text-[#1B2A49] dark:text-[#F4ECDD] flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4 text-[#5E7A63]" />
                    <span>Member sign in</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleNavClick('admin')}
                  className="w-full min-h-[44px] text-xs font-bold text-[#1B2A49]/70 dark:text-[#F4ECDD]/70 hover:text-[#1B2A49] flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
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
