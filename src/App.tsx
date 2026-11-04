import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MeetupModal } from './components/MeetupModal';
import { ArticleModal } from './components/ArticleModal';
import { motion, AnimatePresence } from 'framer-motion';

import { HomePage } from './pages/HomePage';
import { OurStoryPage } from './pages/OurStoryPage';
import { GatheringsPage } from './pages/GatheringsPage';
import { JournalPage } from './pages/JournalPage';
import { CommunityPage } from './pages/CommunityPage';
import { GetInvolvedPage } from './pages/GetInvolvedPage';
import { ContactPage } from './pages/ContactPage';
import { AdminDashboard } from './pages/AdminDashboard';

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
            {currentPage === 'story' && <OurStoryPage />}
            {currentPage === 'gatherings' && <GatheringsPage />}
            {currentPage === 'journal' && <JournalPage />}
            {currentPage === 'community' && <CommunityPage />}
            {currentPage === 'get-involved' && <GetInvolvedPage />}
            {currentPage === 'contact' && <ContactPage />}
            {currentPage === 'admin' && <AdminDashboard />}
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
