import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { 
  Meetup, 
  JournalCategory, 
  Language 
} from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Plus, 
  Trash2, 
  Download, 
  RefreshCw, 
  LogOut, 
  Calendar, 
  Inbox, 
  FileText,
  ExternalLink
} from 'lucide-react';
import { InstagramIcon } from '../components/Icons';
import { InstagramMediaLibrary } from '../components/InstagramMediaLibrary';

const CATEGORIES: JournalCategory[] = [
  'Reader Stories',
  'Personal Essays',
  'Book Reflections',
  'Literature & Culture',
  'Poetry',
  'Opinions',
  'Creative Writing',
  'Community Experiences'
];

export const AdminDashboard: React.FC = () => {
  const { 
    isAdmin, 
    loginAdmin, 
    logoutAdmin,
    meetups, 
    addMeetup, 
    updateMeetup, 
    deleteMeetup,
    articles, 
    addArticle, 
    deleteArticle,
    enquiries, 
    updateEnquiryStatus, 
    deleteEnquiry,
    instagramMedia,
    resetToDefaults,
    exportDataJson
  } = useApp();

  // Login form state
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'meetups' | 'articles' | 'instagram' | 'enquiries'>('overview');

  // Meetup Creation State
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mEdition, setMEdition] = useState('Chapter 15');
  const [mDate, setMDate] = useState('Sunday, November 29, 2026');
  const [mTime, setMTime] = useState('8:30 AM – 11:00 AM IST');
  const [mVenue, setMVenue] = useState('Siddharth Garden / Historic Grounds');
  const [mAddress, setMAddress] = useState('Aurangabad, Maharashtra');
  const [mDesc, setMDesc] = useState('');
  const [mImage, setMImage] = useState('https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=1200&q=80');
  const [mRegUrl, setMRegUrl] = useState('https://forms.gle/readers-of-aurangabad');
  const [mStatus, setMStatus] = useState<Meetup['registrationStatus']>('open');
  const [mIsUpcoming, setMIsUpcoming] = useState(true);

  // Article Creation State
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [aTitle, setATitle] = useState('');
  const [aAuthor, setAAuthor] = useState('Abdul Rafe Farooqui');
  const [aRole, setARole] = useState('Founder, Readers of Aurangabad');
  const [aCategory, setACategory] = useState<JournalCategory>('Literature & Culture');
  const [aLang, setALang] = useState<Language>('en');
  const [aReadTime, setAReadTime] = useState('5');
  const [aCover, setACover] = useState('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80');
  const [aExcerpt, setAExcerpt] = useState('');
  const [aContent, setAContent] = useState('');

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = loginAdmin(passcode.trim());
    if (!success) {
      setLoginError('Incorrect passcode. Use default password: "roa2026"');
    }
  };

  // Handle New Meetup Submit
  const handleCreateMeetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim() || !mVenue.trim()) return;

    addMeetup({
      title: mTitle.trim(),
      edition: mEdition.trim(),
      date: mDate.trim(),
      time: mTime.trim(),
      venue: mVenue.trim(),
      address: mAddress.trim(),
      description: mDesc.trim(),
      featuredImage: mImage.trim(),
      registrationUrl: mRegUrl.trim(),
      registrationStatus: mStatus,
      isUpcoming: mIsUpcoming,
      activities: ['Silent Reading Hour', 'Reader Introductions', 'Book Recommendations']
    });

    setShowMeetupModal(false);
    setMTitle('');
    setMDesc('');
  };

  // Handle New Article Submit
  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aTitle.trim() || !aContent.trim()) return;

    addArticle({
      title: aTitle.trim(),
      slug: aTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      author: aAuthor.trim(),
      authorRole: aRole.trim(),
      category: aCategory,
      publishedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      readingTime: aReadTime.trim(),
      coverImage: aCover.trim(),
      excerpt: aExcerpt.trim(),
      content: aContent.trim(),
      language: aLang,
      tags: ['Aurangabad', aCategory]
    });

    setShowArticleModal(false);
    setATitle('');
    setAExcerpt('');
    setAContent('');
  };

  // 1. If not authenticated, render Login Gate
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 paper-grain">
        <div className="paper-card max-w-md w-full p-8 rounded-3xl bg-white border border-[#E8E2D5] text-center space-y-6 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#1C1B1A] mx-auto shadow-sm">
            <Lock className="w-6 h-6 text-[#8D5B4C]" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C]">
              Readers of Aurangabad
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1C1B1A]">
              Administrative Portal
            </h2>
            <p className="text-xs text-[#595550]">
              Sign in to manage upcoming meetups, publish journal essays, and review volunteer inquiries.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                Admin Passcode
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
              />
              <span className="text-[11px] text-[#8C857B] block mt-1">
                Default demonstration passcode: <strong className="text-[#1C1B1A]">roa2026</strong>
              </span>
            </div>

            {loginError && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#1C1B1A] hover:bg-[#455240] text-white py-3 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-md"
            >
              Sign In to Dashboard
            </button>
          </form>

          <p className="text-[11px] text-[#8C857B]">
            Protected internal area. Regular visitors can browse the public site freely.
          </p>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Dashboard
  const newEnquiriesCount = enquiries.filter(e => e.status === 'new').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 paper-grain">
      
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E2D5] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#EBF0E9] text-[#455240] flex items-center justify-center border border-[#455240]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Curator & Admin Dashboard
            </h1>
            <p className="text-xs text-[#8C857B]">
              Authenticated Session • Readers of Aurangabad (MH20)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportDataJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-xs font-semibold text-[#1C1B1A] hover:bg-white transition-colors"
            title="Download JSON backup of all website content"
          >
            <Download className="w-3.5 h-3.5 text-[#455240]" />
            <span>Backup Data (JSON)</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset all website data to initial sample meetups and articles?')) {
                resetToDefaults();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-xs font-semibold text-[#8D5B4C] hover:bg-white transition-colors"
            title="Restore default pre-seeded data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-[#8D5B4C] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D5] pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'overview' ? 'bg-[#1C1B1A] text-white shadow-sm' : 'text-[#595550] hover:text-[#1C1B1A]'
          }`}
        >
          Overview & Stats
        </button>
        
        <button
          onClick={() => setActiveTab('meetups')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'meetups' ? 'bg-[#1C1B1A] text-white shadow-sm' : 'text-[#595550] hover:text-[#1C1B1A]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Meetups ({meetups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'articles' ? 'bg-[#1C1B1A] text-white shadow-sm' : 'text-[#595550] hover:text-[#1C1B1A]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Journal Pieces ({articles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('instagram')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'instagram' ? 'bg-[#1C1B1A] text-white shadow-sm' : 'text-[#595550] hover:text-[#1C1B1A]'
          }`}
        >
          <InstagramIcon className="w-3.5 h-3.5" />
          <span>Instagram Media Library ({instagramMedia.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'enquiries' ? 'bg-[#1C1B1A] text-white shadow-sm' : 'text-[#595550] hover:text-[#1C1B1A]'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Inquiries ({enquiries.length})</span>
          {newEnquiriesCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#8D5B4C] text-white text-[10px] flex items-center justify-center">
              {newEnquiriesCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="paper-card p-6 rounded-2xl bg-white border border-[#E8E2D5]">
              <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Total Gatherings</span>
              <span className="font-serif text-3xl font-bold text-[#1C1B1A] block mt-1">{meetups.length}</span>
              <span className="text-xs text-[#455240] block mt-1">
                {meetups.filter(m => m.isUpcoming).length} active/upcoming
              </span>
            </div>

            <div className="paper-card p-6 rounded-2xl bg-white border border-[#E8E2D5]">
              <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Published Articles</span>
              <span className="font-serif text-3xl font-bold text-[#1C1B1A] block mt-1">{articles.length}</span>
              <span className="text-xs text-[#455240] block mt-1">Across 4 languages</span>
            </div>

            <div className="paper-card p-6 rounded-2xl bg-white border border-[#E8E2D5]">
              <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Instagram Media</span>
              <span className="font-serif text-3xl font-bold text-[#8D5B4C] block mt-1">{instagramMedia.length}</span>
              <span className="text-xs text-[#455240] block mt-1">
                {instagramMedia.filter(m => m.status === 'published').length} published on site
              </span>
            </div>

            <div className="paper-card p-6 rounded-2xl bg-white border border-[#E8E2D5]">
              <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Pending Inquiries</span>
              <span className="font-serif text-3xl font-bold text-[#1C1B1A] block mt-1">{newEnquiriesCount}</span>
              <span className="text-xs text-[#8C857B] block mt-1">Volunteers & Donations</span>
            </div>

            <div className="paper-card p-6 rounded-2xl bg-white border border-[#E8E2D5]">
              <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Movement Location</span>
              <span className="font-serif text-2xl font-bold text-[#1C1B1A] block mt-1">Aurangabad</span>
              <span className="text-xs text-[#8C857B] block mt-1">MH20 • Maharashtra</span>
            </div>

          </div>

          <div className="paper-card p-8 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Curator Quick Actions
            </h3>
            <p className="text-sm text-[#595550]">
              Everything you add or update here is persisted in the site database immediately.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  setActiveTab('meetups');
                  setShowMeetupModal(true);
                }}
                className="inline-flex items-center gap-2 bg-[#1C1B1A] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#455240] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Meetup</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('articles');
                  setShowArticleModal(true);
                }}
                className="inline-flex items-center gap-2 bg-[#455240] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1C1B1A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Write Journal Piece</span>
              </button>

              <button
                onClick={() => setActiveTab('instagram')}
                className="inline-flex items-center gap-2 bg-[#FAF8F5] text-[#1C1B1A] border border-[#E8E2D5] px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-white transition-colors"
              >
                <InstagramIcon className="w-4 h-4 text-[#8D5B4C]" />
                <span>Instagram Media & Reels</span>
              </button>

              <button
                onClick={() => setActiveTab('enquiries')}
                className="inline-flex items-center gap-2 bg-white text-[#1C1B1A] border border-[#E8E2D5] px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#FAF8F5] transition-colors"
              >
                <Inbox className="w-4 h-4" />
                <span>View Recent Submissions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEETUPS MANAGER */}
      {activeTab === 'meetups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Manage Meetups & Gatherings
            </h2>
            <button
              onClick={() => setShowMeetupModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#1C1B1A] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#455240] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Meetup</span>
            </button>
          </div>

          <div className="space-y-4">
            {meetups.map((meetup) => (
              <div 
                key={meetup.id}
                className="paper-card p-5 rounded-2xl bg-white border border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={meetup.featuredImage}
                    alt={meetup.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#E8E2D5]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {meetup.edition && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1C1B1A] text-white uppercase">
                          {meetup.edition}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        meetup.isUpcoming ? 'bg-[#EBF0E9] text-[#2E372B]' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {meetup.isUpcoming ? 'Upcoming' : 'Archived Past'}
                      </span>
                      <span className="text-[10px] font-semibold text-[#8D5B4C] uppercase">
                        Status: {meetup.registrationStatus}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">
                      {meetup.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C857B]">
                      <span>{meetup.date}</span>
                      <span>•</span>
                      <span>{meetup.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      updateMeetup(meetup.id, {
                        isUpcoming: !meetup.isUpcoming,
                        registrationStatus: meetup.isUpcoming ? 'past' : 'open'
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#E8E2D5] text-xs font-medium text-[#595550] hover:bg-[#FAF8F5]"
                  >
                    {meetup.isUpcoming ? 'Mark as Past' : 'Mark as Upcoming'}
                  </button>

                  <a
                    href={meetup.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-[#E8E2D5] text-[#595550] hover:text-[#1C1B1A]"
                    title="Open Registration Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${meetup.title}"?`)) {
                        deleteMeetup(meetup.id);
                      }
                    }}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    title="Delete Meetup"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ARTICLES MANAGER */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Manage Journal Articles
            </h2>
            <button
              onClick={() => setShowArticleModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#1C1B1A] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#455240] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Article</span>
            </button>
          </div>

          <div className="space-y-4">
            {articles.map((art) => (
              <div 
                key={art.id}
                className="paper-card p-5 rounded-2xl bg-white border border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={art.coverImage}
                    alt={art.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#E8E2D5]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF8F5] text-[#8D5B4C] border border-[#E8E2D5]">
                        {art.category}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-[#8C857B]">
                        Language: {art.language}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-lg text-[#1C1B1A]">
                      {art.title}
                    </h4>
                    <p className="text-xs text-[#8C857B]">
                      By {art.author} • {art.publishedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (confirm(`Delete article "${art.title}"?`)) {
                        deleteArticle(art.id);
                      }
                    }}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    title="Delete Article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INSTAGRAM MEDIA LIBRARY */}
      {activeTab === 'instagram' && (
        <InstagramMediaLibrary />
      )}

      {/* TAB 5: ENQUIRIES & SUBMISSIONS */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Volunteer, Book Donations & Contact Inquiries
            </h2>
            <span className="text-xs text-[#8C857B]">
              Total: {enquiries.length} submissions
            </span>
          </div>

          {enquiries.length > 0 ? (
            <div className="space-y-4">
              {enquiries.map((enq) => (
                <div 
                  key={enq.id}
                  className="paper-card p-6 rounded-2xl bg-white border border-[#E8E2D5] space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F4EFEA] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1C1B1A] text-white">
                        {enq.type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        enq.status === 'new' 
                          ? 'bg-amber-100 text-amber-800' 
                          : enq.status === 'contacted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        Status: {enq.status.toUpperCase()}
                      </span>
                    </div>

                    <span className="text-xs text-[#8C857B]">
                      Received: {new Date(enq.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <strong className="text-[#1C1B1A] block">From:</strong>
                      <span>{enq.name}</span>
                    </div>
                    <div>
                      <strong className="text-[#1C1B1A] block">Email:</strong>
                      <a href={`mailto:${enq.email}`} className="text-[#455240] hover:underline">
                        {enq.email}
                      </a>
                    </div>
                    {enq.phone && (
                      <div>
                        <strong className="text-[#1C1B1A] block">Phone:</strong>
                        <span>{enq.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-xs text-[#2A2826] leading-relaxed">
                    <strong className="block mb-1 text-[#8D5B4C]">Message:</strong>
                    {enq.message}
                  </div>

                  {enq.details && Object.keys(enq.details).length > 0 && (
                    <div className="text-[11px] text-[#595550] flex flex-wrap gap-2">
                      {Object.entries(enq.details).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                          {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#F4EFEA]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateEnquiryStatus(enq.id, 'contacted')}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-[#E8E2D5] hover:bg-[#FAF8F5]"
                      >
                        Mark Contacted
                      </button>
                      <button
                        onClick={() => updateEnquiryStatus(enq.id, 'resolved')}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-green-200 text-green-700 hover:bg-green-50"
                      >
                        Mark Resolved
                      </button>
                    </div>

                    <button
                      onClick={() => deleteEnquiry(enq.id)}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E8E2D5] text-xs text-[#595550]">
              No inquiries yet.
            </div>
          )}
        </div>
      )}

      {/* CREATE MEETUP MODAL */}
      {showMeetupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="paper-card max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2D5] space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Create New Gathering
            </h3>

            <form onSubmit={handleCreateMeetup} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Meetup Title</label>
                <input
                  type="text"
                  required
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="e.g. Winter Dawn Reading Circle"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Edition / Chapter</label>
                  <input
                    type="text"
                    value={mEdition}
                    onChange={(e) => setMEdition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Registration Status</label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as Meetup['registrationStatus'])}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  >
                    <option value="open">Open</option>
                    <option value="announced">Announced (Venue Pending)</option>
                    <option value="closed">Closed</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Date</label>
                  <input
                    type="text"
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Time</label>
                  <input
                    type="text"
                    value={mTime}
                    onChange={(e) => setMTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Venue Name</label>
                <input
                  type="text"
                  required
                  value={mVenue}
                  onChange={(e) => setMVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={mAddress}
                  onChange={(e) => setMAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Google Form Registration URL</label>
                <input
                  type="url"
                  required
                  value={mRegUrl}
                  onChange={(e) => setMRegUrl(e.target.value)}
                  placeholder="https://forms.gle/..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Featured Photo URL</label>
                <input
                  type="url"
                  value={mImage}
                  onChange={(e) => setMImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  placeholder="Details about books, vibe, tea, etc."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isUpcomingCheckbox"
                  checked={mIsUpcoming}
                  onChange={(e) => setMIsUpcoming(e.target.checked)}
                  className="rounded text-[#455240]"
                />
                <label htmlFor="isUpcomingCheckbox" className="font-medium text-[#1C1B1A]">
                  Show on Homepage as Upcoming Gathering
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMeetupModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#595550]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1C1B1A] text-white hover:bg-[#455240]"
                >
                  Save Meetup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ARTICLE MODAL */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="paper-card max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2D5] space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              Publish Journal Article
            </h3>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={aTitle}
                  onChange={(e) => setATitle(e.target.value)}
                  placeholder="e.g. Reading Wali Dakhani in Aurangabad"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Author Name</label>
                  <input
                    type="text"
                    value={aAuthor}
                    onChange={(e) => setAAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Author Role</label>
                  <input
                    type="text"
                    value={aRole}
                    onChange={(e) => setARole(e.target.value)}
                    placeholder="e.g. Reader & Columnist"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Category</label>
                  <select
                    value={aCategory}
                    onChange={(e) => setACategory(e.target.value as JournalCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Language</label>
                  <select
                    value={aLang}
                    onChange={(e) => setALang(e.target.value as Language)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="ur">Urdu (اردو)</option>
                    <option value="mr">Marathi (मराठी)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Est. Reading Time (Mins)</label>
                  <input
                    type="number"
                    value={aReadTime}
                    onChange={(e) => setAReadTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1C1B1A] mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={aCover}
                    onChange={(e) => setACover(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Short Excerpt</label>
                <textarea
                  rows={2}
                  value={aExcerpt}
                  onChange={(e) => setAExcerpt(e.target.value)}
                  placeholder="One or two sentences summarizing the piece..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">Full Article Content</label>
                <textarea
                  rows={6}
                  required
                  value={aContent}
                  onChange={(e) => setAContent(e.target.value)}
                  placeholder="Write or paste the full essay or story here (separate paragraphs with blank lines)..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#595550]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1C1B1A] text-white hover:bg-[#455240]"
                >
                  Publish to Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
