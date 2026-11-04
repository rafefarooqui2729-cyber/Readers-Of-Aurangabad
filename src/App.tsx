import React, { Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MeetupModal } from './components/MeetupModal';
import { ArticleModal } from './components/ArticleModal';
import { motion, AnimatePresence } from 'framer-motion';

import { HomePage } from './pages/HomePage';

// Lazy-load secondary pages for code-splitting
const OurStoryPage = React.lazy(() => import('./pages/OurStoryPage').then(m => ({ default: m.OurStoryPage })));
const GatheringsPage = React.lazy(() => import('./pages/GatheringsPage').then(m => ({ default: m.GatheringsPage })));
const JournalPage = React.lazy(() => import('./pages/JournalPage').then(m => ({ default: m.JournalPage })));
const CommunityPage = React.lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })));
const GetInvolvedPage = React.lazy(() => import('./pages/GetInvolvedPage').then(m => ({ default: m.GetInvolvedPage })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Minimal loading placeholder to avoid layout shift
const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-[#455240] border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const { 
    currentPage, 
    selectedMeetup, 
    setSelectedMeetup, 
    selectedArticle, 
    setSelectedArticle 
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1B1A]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Page Content with Smooth Page Fade Transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentPage === 'home' && <HomePage />}
            <Suspense fallback={<PageLoader />}>
              {currentPage === 'story' && <OurStoryPage />}
              {currentPage === 'gatherings' && <GatheringsPage />}
              {currentPage === 'journal' && <JournalPage />}
              {currentPage === 'community' && <CommunityPage />}
              {currentPage === 'get-involved' && <GetInvolvedPage />}
              {currentPage === 'contact' && <ContactPage />}
              {currentPage === 'admin' && <AdminDashboard />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Interactive Modals */}
      <MeetupModal
        meetup={selectedMeetup}
        onClose={() => setSelectedMeetup(null)}
      />

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onSelectArticle={(article) => setSelectedArticle(article)}
      />

      {/* Footer */}
      <Footer />
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
