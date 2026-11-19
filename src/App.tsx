import React, { Suspense, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BookLoader } from './components/BookLoader';
import { CinematicAtmosphere } from './components/CinematicAtmosphere';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { PaperGrain } from './components/ui/PaperGrain';

const MeetupModal = React.lazy(() => import('./components/MeetupModal').then(m => ({ default: m.MeetupModal })));
const ArticleModal = React.lazy(() => import('./components/ArticleModal').then(m => ({ default: m.ArticleModal })));

/**
 * Retryable React.lazy wrapper.
 *
 * The promise cache coalesces concurrent loads and retains successful imports.
 * React.lazy also caches rejected results, so recovery replaces the lazy
 * component instance after an Error Boundary retry.
 */
function lazyRetryable<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  let cachedPromise: Promise<{ default: T }> | null = null;

  return React.lazy(() => {
    if (cachedPromise) return cachedPromise;
    cachedPromise = factory().catch((err) => {
      // Clear the cache so the next render attempt creates a fresh import()
      cachedPromise = null;
      throw err;
    });
    return cachedPromise;
  });
}

const pageFactories = {
  home: () => import('./pages/HomePage').then(m => ({ default: m.HomePage as React.ComponentType<unknown> })),
  story: () => import('./pages/OurStoryPage').then(m => ({ default: m.OurStoryPage as React.ComponentType<unknown> })),
  gatherings: () => import('./pages/GatheringsPage').then(m => ({ default: m.GatheringsPage as React.ComponentType<unknown> })),
  journal: () => import('./pages/JournalPage').then(m => ({ default: m.JournalPage as React.ComponentType<unknown> })),
  community: () => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage as React.ComponentType<unknown> })),
  'get-involved': () => import('./pages/GetInvolvedPage').then(m => ({ default: m.GetInvolvedPage as React.ComponentType<unknown> })),
  contact: () => import('./pages/ContactPage').then(m => ({ default: m.ContactPage as React.ComponentType<unknown> })),
  admin: () => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard as React.ComponentType<unknown> })),
  '404': () => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage as React.ComponentType<unknown> })),
};

const createLazyPages = () => ({
  home: lazyRetryable(pageFactories.home),
  story: lazyRetryable(pageFactories.story),
  gatherings: lazyRetryable(pageFactories.gatherings),
  journal: lazyRetryable(pageFactories.journal),
  community: lazyRetryable(pageFactories.community),
  'get-involved': lazyRetryable(pageFactories['get-involved']),
  contact: lazyRetryable(pageFactories.contact),
  admin: lazyRetryable(pageFactories.admin),
  '404': lazyRetryable(pageFactories['404']),
});

/**
 * Error Boundary for lazy-loaded pages.
 * Catches rejected dynamic imports and renders a recoverable error state
 * instead of leaving a blank page or a permanent loader.
 */
interface PageErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  suppressError?: boolean;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): PageErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Page loading error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.suppressError) return null;

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="max-w-md border-2 border-[#171717] dark:border-[#F4F0E8]/30 bg-[#FFFCF5] dark:bg-[#202020] p-8 shadow-[8px_8px_0_#171717] dark:shadow-[8px_8px_0_#000]">
            <div className="w-14 h-14 mx-auto mb-5 border-2 border-[#171717] bg-[#D9F36A] flex items-center justify-center">
              <svg className="w-7 h-7 text-[#171717]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="font-display text-2xl uppercase tracking-[-0.02em] text-[#171717] dark:text-[#F4F0E8] mb-2">
              Unable to load this page
            </h2>
            <p className="text-sm text-[#4F4A43] dark:text-[#D6D0C6] mb-6">
              Something went wrong while loading. Please check your connection and try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="min-h-[48px] px-6 py-2.5 border-2 border-[#171717] bg-[#F4512C] text-white text-sm font-bold uppercase tracking-[0.04em] shadow-[4px_4px_0_#171717] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_#171717] transition-transform cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const {
    currentPage,
    selectedMeetup,
    setSelectedMeetup,
    selectedArticle,
    setSelectedArticle,
    isPageLoading,
    navError,
    retryNavigation,
    isPasswordRecovery
  } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const isPublicShell = currentPage !== 'admin' && !isPasswordRecovery;

  const [lazyPages, setLazyPages] = React.useState(createLazyPages);

  // Replace the rejected React.lazy component for the specified page.
  const resetLazyPage = React.useCallback((page: typeof currentPage) => {
    setLazyPages(previous => ({
      ...previous,
      [page]: lazyRetryable(pageFactories[page]),
    }));
  }, []);

  // PageErrorBoundary retries the page currently being rendered.
  const retryLazyPage = React.useCallback(() => {
    resetLazyPage(currentPage);
  }, [currentPage, resetLazyPage]);

  // Navigation failures must retry the failed destination, not currentPage.
  const retryFailedNavigation = React.useCallback(() => {
    if (!navError) return;

    resetLazyPage(navError.page);
    retryNavigation();
  }, [navError, resetLazyPage, retryNavigation]);

  const initialLoaderDismissedRef = React.useRef(false);

  // Hand off smoothly from static index.html initial-loader once React has mounted
  // and the first page content is actually ready (not just React hydrated).
  useEffect(() => {
    if (initialLoaderDismissedRef.current) return;

    // Wait until the first page has actually finished loading (isPageLoading is false)
    // before dismissing the initial HTML loader.
    if (isPageLoading) return;

    const initialLoader = document.getElementById('initial-loader');
    if (!initialLoader) {
      initialLoaderDismissedRef.current = true;
      return;
    }

    initialLoader.style.opacity = '0';
    initialLoader.style.pointerEvents = 'none';
    const timer = setTimeout(() => {
      initialLoader.remove();
      initialLoaderDismissedRef.current = true;
    }, 450);
    return () => clearTimeout(timer);
  }, [isPageLoading]);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#F4F0E8] dark:bg-[#171717] text-[#171717] dark:text-[#F4F0E8] transition-colors duration-200">
      <PaperGrain />

      {/* Accessible Skip-to-Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#F4512C] focus:text-white focus:font-bold focus:rounded-none focus:border-2 focus:border-[#171717] focus:outline-none"
      >
        Skip to main content
      </a>

      {isPublicShell && <CinematicAtmosphere />}

      <div className={`relative z-10 flex flex-1 flex-col ${isPublicShell ? 'cinematic-shell mh20-shell' : ''}`}>
        <Navbar />

        {/* Main Page Content with Smooth Page Fade Transitions */}
        <main
          id="main-content"
          tabIndex={-1}
          className={currentPage === 'admin' || isPasswordRecovery ? 'admin-shell flex-1' : 'flex-1 focus:outline-none'}
        >
        {isPasswordRecovery ? (
          <ResetPasswordPage />
        ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <PageErrorBoundary
              onRetry={retryLazyPage}
              suppressError={navError !== null}
            >
              <Suspense fallback={<BookLoader fullScreen />}>
                {currentPage === 'home' && React.createElement(lazyPages.home)}
                {currentPage === 'story' && React.createElement(lazyPages.story)}
                {currentPage === 'gatherings' && React.createElement(lazyPages.gatherings)}
                {currentPage === 'journal' && React.createElement(lazyPages.journal)}
                {currentPage === 'community' && React.createElement(lazyPages.community)}
                {currentPage === 'get-involved' && React.createElement(lazyPages['get-involved'])}
                {currentPage === 'contact' && React.createElement(lazyPages.contact)}
                {currentPage === 'admin' && React.createElement(lazyPages.admin)}
                {currentPage === '404' && React.createElement(lazyPages['404'])}
              </Suspense>
            </PageErrorBoundary>
          </motion.div>
        </AnimatePresence>
        )}
        </main>

        <Footer />
      </div>

      {/* Navigation error recovery overlay */}
      <AnimatePresence>
        {navError && (
          <motion.div
            key="nav-error-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F4F0E8] dark:bg-[#171717]"
          >
            <div className="text-center px-6 max-w-md border-2 border-[#171717] dark:border-[#F4F0E8]/30 bg-[#FFFCF5] dark:bg-[#202020] p-8 shadow-[8px_8px_0_#171717] dark:shadow-[8px_8px_0_#000]">
              <div className="w-14 h-14 mx-auto mb-5 border-2 border-[#171717] bg-[#D9F36A] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#171717]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="font-display text-2xl uppercase tracking-[-0.02em] text-[#171717] dark:text-[#F4F0E8] mb-2">
                Page could not be loaded
              </h2>
              <p className="text-sm text-[#4F4A43] dark:text-[#D6D0C6] mb-6">
                We were unable to load this page. Please check your network connection and try again.
              </p>
              <button
                onClick={retryFailedNavigation}
                className="min-h-[48px] px-6 py-2.5 border-2 border-[#171717] bg-[#F4512C] text-white text-sm font-bold uppercase tracking-[0.04em] shadow-[4px_4px_0_#171717] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_#171717] transition-transform cursor-pointer"
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={isPublicShell ? 'cinematic-shell mh20-shell' : ''}>
        {/* Global Interactive Modals */}
        <Suspense fallback={null}>
          <AnimatePresence>
            {selectedMeetup && (
              <MeetupModal
                key={selectedMeetup.id}
                meetup={selectedMeetup}
                onClose={() => setSelectedMeetup(null)}
              />
            )}
          </AnimatePresence>
        </Suspense>

        <Suspense fallback={null}>
          <AnimatePresence>
            {selectedArticle && (
              <ArticleModal
                key={selectedArticle.id}
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
                onSelectArticle={(article) => setSelectedArticle(article)}
              />
            )}
          </AnimatePresence>
        </Suspense>
      </div>

      {/* Global Full-Screen Book Page-Turning Loader */}
      <AnimatePresence>
        {isPageLoading && (
          <motion.div
            key="global-book-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 pointer-events-auto"
          >
            <BookLoader fullScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
