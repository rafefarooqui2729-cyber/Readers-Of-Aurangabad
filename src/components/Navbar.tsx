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
    <header className="sticky top-0 z-40 border-b border-[color:var(--rr-border)] bg-[color:var(--rr-paper)]/95 backdrop-blur-sm">
      <div className="rr-container">
        <div className="flex h-[82px] items-center justify-between gap-4">
          <button
            onClick={() => handleNavClick('home')}
            className="group flex min-w-0 items-center gap-3 text-left cursor-pointer"
            aria-label="Readers of Aurangabad Home"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--rr-border)] bg-[color:var(--rr-ivory)] p-0.5">
              <img
                src="/brand/logo.png"
                alt="Readers of Aurangabad logo"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[1.1rem] uppercase leading-none tracking-[-0.02em] text-[color:var(--rr-ink)] sm:text-[1.3rem]">
                Readers of Aurangabad
              </span>
              <span className="rr-meta mt-1.5 block text-[color:var(--rr-forest)]">
                MH20 · City Reading Collective
              </span>
            </span>
          </button>

          <nav className="hidden items-center lg:flex" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = currentPage === link.key;
              return (
                <button
                  key={link.key}
                  onClick={() => handleNavClick(link.key)}
                  className={`relative min-h-[44px] px-3 py-2 font-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[color:var(--rr-forest)]'
                      : 'text-[color:var(--rr-muted)] hover:text-[color:var(--rr-ink)]'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 bottom-1 h-px bg-[color:var(--rr-terracotta)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 border-l border-[color:var(--rr-border)] pl-3 lg:flex">
            <ThemeToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="rr-touch inline-flex items-center gap-1.5 border border-[color:var(--rr-border)] px-2.5 py-2 text-[color:var(--rr-ink)] transition-colors hover:border-[color:var(--rr-brass)] cursor-pointer"
                title="Change language"
                aria-label="Select language"
                aria-expanded={langDropdownOpen}
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="rr-meta">{lang}</span>
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute mt-2 w-40 border border-[color:var(--rr-border)] bg-[color:var(--rr-paper)] p-1 z-50 ${isRTL ? 'left-0' : 'right-0'}`}
                  >
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => handleLanguageSelect(l.code)}
                        className={`flex w-full min-h-[40px] items-center justify-between border-b border-[color:var(--rr-border)] px-3 py-2 text-left text-xs transition-colors last:border-b-0 cursor-pointer ${
                          lang === l.code
                            ? 'text-[color:var(--rr-terracotta)]'
                            : 'text-[color:var(--rr-ink)] hover:text-[color:var(--rr-forest)]'
                        }`}
                      >
                        <span>{l.nativeName}</span>
                        <span className="rr-meta text-[9px] opacity-70">{l.code}</span>
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
                className="rr-touch inline-flex items-center gap-1.5 border border-[color:var(--rr-border)] px-2.5 py-2 text-[color:var(--rr-ink)] transition-colors hover:border-[color:var(--rr-brass)] cursor-pointer"
                title="Signed in"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="rr-meta">Sign out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMemberSignInOpen(true)}
                className="rr-touch inline-flex items-center gap-1.5 border border-[color:var(--rr-border)] px-2.5 py-2 text-[color:var(--rr-ink)] transition-colors hover:border-[color:var(--rr-brass)] cursor-pointer"
              >
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="rr-meta">Member</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavClick('admin')}
              className={`rr-touch flex h-11 w-11 items-center justify-center border transition-colors cursor-pointer ${
                currentPage === 'admin'
                  ? 'border-[color:var(--rr-forest)] bg-[color:var(--rr-forest)] text-[color:var(--rr-on-dark)]'
                  : isAdmin
                  ? 'border-[color:var(--rr-brass)] bg-[color:var(--rr-sage)] text-[color:var(--rr-forest)]'
                  : 'border-[color:var(--rr-border)] text-[color:var(--rr-muted)] hover:border-[color:var(--rr-brass)] hover:text-[color:var(--rr-forest)]'
              }`}
              title={isAdmin ? 'Admin Portal (Authenticated)' : 'Admin Portal'}
              aria-label="Admin Portal"
            >
              {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className="rr-btn"
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
              className="rr-touch flex h-11 w-11 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-ink)]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
              className="overflow-hidden border-t border-[color:var(--rr-border)] py-5 lg:hidden"
            >
              <nav className="flex flex-col" aria-label="Mobile Navigation">
                {navLinks.map((link) => (
                  <button
                    key={link.key}
                    type="button"
                    onClick={() => handleNavClick(link.key)}
                    className={`rr-touch flex min-h-[48px] w-full items-center justify-between border-b border-[color:var(--rr-border)] px-1 py-3 text-left font-display text-xl uppercase tracking-tight transition-colors ${
                      currentPage === link.key
                        ? 'text-[color:var(--rr-terracotta)]'
                        : 'text-[color:var(--rr-ink)]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {currentPage === link.key && (
                      <span className="h-px w-6 bg-[color:var(--rr-terracotta)]" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-6">
                <span className="rr-meta mb-3 block text-[color:var(--rr-muted)]">
                  Language
                </span>
                <div className="grid grid-cols-2 border-l border-t border-[color:var(--rr-border)]">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleLanguageSelect(l.code)}
                      className={`rr-touch border-b border-r border-[color:var(--rr-border)] px-3 py-2 text-xs ${
                        lang === l.code
                          ? 'bg-[color:var(--rr-forest)] text-[color:var(--rr-on-dark)]'
                          : 'text-[color:var(--rr-ink)]'
                      }`}
                    >
                      {l.nativeName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => handleNavClick('contact')}
                  className="rr-btn w-full"
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
                    className="rr-btn rr-btn--outline w-full"
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
                    className="rr-btn rr-btn--outline w-full"
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span>Member sign in</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleNavClick('admin')}
                  className="rr-link w-full justify-center"
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
