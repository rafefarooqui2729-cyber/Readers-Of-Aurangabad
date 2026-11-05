import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { EnquiryType } from '../types';
import { 
  BookOpen, 
  HandHeart, 
  Send, 
  CheckCircle, 
  MessageCircle, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { InstagramIcon } from '../components/Icons';

export const GetInvolvedPage: React.FC = () => {
  const { addEnquiry, meetups, setCurrentPage } = useApp();
  const [activeTab, setActiveTab] = useState<EnquiryType>('volunteer');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  
  // Specific dynamic fields
  const [volunteerSkills, setVolunteerSkills] = useState('');
  const [bookDetails, setBookDetails] = useState('');
  const [collabOrg, setCollabOrg] = useState('');
  const [collabType, setCollabType] = useState('Café / Venue Partner');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const upcomingMeetup = meetups.find(m => m.isUpcoming);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please fill in your name, email address, and a short message.');
      return;
    }

    setIsSubmitting(true);

    const details: Record<string, any> = {};
    if (activeTab === 'volunteer') {
      details.skills = volunteerSkills;
    } else if (activeTab === 'book_donation') {
      details.booksDescription = bookDetails;
    } else if (activeTab === 'collaboration') {
      details.organization = collabOrg;
      details.collaborationType = collabType;
    }

    setTimeout(() => {
      addEnquiry({
        type: activeTab,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        details
      });

      setIsSubmitting(false);
      setSuccessMessage('Your expression of interest has been safely recorded. Our team will reach out to you shortly.');
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setVolunteerSkills('');
      setBookDetails('');
      setCollabOrg('');
    }, 600);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 paper-grain">
      
      {/* 1. HERO HEADER */}
      <section className="pt-6 sm:pt-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E9] border border-[#455240]/20 text-[#2E372B] text-xs font-semibold">
          <HandHeart className="w-3.5 h-3.5 text-[#455240]" />
          <span>Participate in the Movement</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1C1B1A] leading-[1.15]">
          Get Involved
        </h1>

        <p className="text-lg sm:text-xl text-[#595550] font-serif italic max-w-2xl mx-auto leading-relaxed">
          "A reading movement flourishes not through passive observers, but through hands that lay out mats, share books, and welcome strangers."
        </p>

        <div className="relative h-56 sm:h-72 rounded-3xl overflow-hidden border border-[#E8E2D5] shadow-md max-w-4xl mx-auto mt-6 group">
          <img
            src="/images/processed/community/get-involved-banner.webp"
            alt="Readers of Aurangabad exchanging books and collaborating"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-[center_25%] group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
            <span className="text-white text-xs sm:text-sm font-medium">
              Community book exchange and volunteer circle — Readers of MH20
            </span>
          </div>
        </div>
      </section>

      {/* 2. FAST ACTION TILES: Join & Attend */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tile A: Join Community Online */}
          <div className="paper-card p-8 rounded-3xl space-y-5 bg-white border border-[#E8E2D5] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8D5B4C]">
                <InstagramIcon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
                Join the Community Online
              </h3>
              <p className="text-sm text-[#595550] leading-relaxed">
                Follow our official Instagram for weekly Sunday meetup announcements, venue updates, book excerpts, and community spotlights.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <a
                href="https://instagram.com/readers.of.aurangabad"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1C1B1A] hover:bg-[#455240] text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm"
              >
                <InstagramIcon className="w-3.5 h-3.5" />
                <span>Follow @readers.of.aurangabad</span>
                <ExternalLink className="w-3 h-3 text-[#B4ADA2]" />
              </a>

              <a
                href="https://chat.whatsapp.com/invite-readers-of-aurangabad"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#EBF0E9] hover:bg-[#455240] hover:text-white text-[#2E372B] px-5 py-2.5 rounded-full text-xs font-semibold transition-all border border-[#455240]/20"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Join WhatsApp Announcements</span>
              </a>
            </div>
          </div>

          {/* Tile B: Attend a Meetup */}
          <div className="paper-card p-8 rounded-3xl space-y-5 bg-[#FAF8F5] border border-[#E8E2D5] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E2D5] flex items-center justify-center text-[#455240]">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
                Attend an Upcoming Gathering
              </h3>
              <p className="text-sm text-[#595550] leading-relaxed">
                Registrations for our gatherings are free and managed simply via Google Forms to help us gauge attendance and arrange shade.
              </p>
            </div>

            <div className="pt-4">
              {upcomingMeetup && upcomingMeetup.registrationStatus === 'open' ? (
                <a
                  href={upcomingMeetup.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#455240] hover:bg-[#1C1B1A] text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm"
                >
                  <span>RSVP for {upcomingMeetup.title}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => setCurrentPage('gatherings')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#1C1B1A] hover:text-[#455240] underline"
                >
                  <span>Check Meetup Archive & Schedules</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 3. MULTI-PURPOSE ENQUIRY FORM (Volunteer, Donate Books, Collaborate) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="paper-card p-8 sm:p-12 rounded-3xl bg-white border border-[#E8E2D5] shadow-lg">
          
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C]">
              Direct Inquiry
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1C1B1A]">
              Connect Your Passion With the Movement
            </h2>
            <p className="text-sm text-[#595550]">
              Select how you would like to participate below:
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] mb-8 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('volunteer');
                setSuccessMessage('');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                activeTab === 'volunteer' 
                  ? 'bg-[#1C1B1A] text-white shadow' 
                  : 'text-[#595550] hover:text-[#1C1B1A]'
              }`}
            >
              Become a Volunteer
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('book_donation');
                setSuccessMessage('');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                activeTab === 'book_donation' 
                  ? 'bg-[#1C1B1A] text-white shadow' 
                  : 'text-[#595550] hover:text-[#1C1B1A]'
              }`}
            >
              Donate Physical Books
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('collaboration');
                setSuccessMessage('');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                activeTab === 'collaboration' 
                  ? 'bg-[#1C1B1A] text-white shadow' 
                  : 'text-[#595550] hover:text-[#1C1B1A]'
              }`}
            >
              Collaborate / Venue
            </button>
          </div>

          {/* Dynamic Explanatory Callout */}
          <div className="mb-6 p-4 rounded-xl text-xs bg-[#FAF8F5] border border-[#E8E2D5] text-[#595550]">
            {activeTab === 'volunteer' && (
              <p>
                <strong>Volunteering:</strong> Help with Sunday morning setup, taking photographs of real meetup moments, or managing social media announcements.
              </p>
            )}
            {activeTab === 'book_donation' && (
              <p>
                <strong>Book Donations:</strong> We accept good-condition fiction, non-fiction, poetry, and educational books across English, Marathi, Hindi, and Urdu to seed our community lending shelf.
              </p>
            )}
            {activeTab === 'collaboration' && (
              <p>
                <strong>Collaborations:</strong> Are you a local café, independent bookstore, college literary club, or cultural institution in Aurangabad? Let’s organize a joint gathering.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Farhan Shaikh"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                WhatsApp / Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
              />
            </div>

            {/* Context-Specific Fields */}
            {activeTab === 'volunteer' && (
              <div>
                <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                  How would you like to help? (Skills / Interests)
                </label>
                <input
                  type="text"
                  value={volunteerSkills}
                  onChange={(e) => setVolunteerSkills(e.target.value)}
                  placeholder="e.g. Event photography, park coordination, poster design"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
                />
              </div>
            )}

            {activeTab === 'book_donation' && (
              <div>
                <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                  Approximate Quantity & Genres
                </label>
                <input
                  type="text"
                  value={bookDetails}
                  onChange={(e) => setBookDetails(e.target.value)}
                  placeholder="e.g. 15 Marathi novels and 10 English paperbacks"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
                />
              </div>
            )}

            {activeTab === 'collaboration' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                    Organization / Café Name
                  </label>
                  <input
                    type="text"
                    value={collabOrg}
                    onChange={(e) => setCollabOrg(e.target.value)}
                    placeholder="e.g. Old City Bookhouse / Deccan Roasters"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                    Partner Category
                  </label>
                  <select
                    value={collabType}
                    onChange={(e) => setCollabType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
                  >
                    <option value="Café / Venue Partner">Café / Venue Partner</option>
                    <option value="Bookstore / Publisher">Bookstore / Publisher</option>
                    <option value="College / University Society">College / University Society</option>
                    <option value="Cultural / Literary NGO">Cultural / Literary NGO</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                Your Message / Note <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us a little bit about yourself and why you'd like to be involved..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 text-xs text-green-800 bg-green-50 p-3 rounded-xl border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1C1B1A] hover:bg-[#455240] text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting your note...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Expression of Interest</span>
                </>
              )}
            </button>
          </form>

        </div>
      </section>

      {/* 4. FUTURE EXPANSION NOTE (Honoring Budget = ₹0, No Paid Gateways) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8D5B4C]">
          The Future Horizon
        </span>
        <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
          Building a Community Reading Sanctuary
        </h3>
        <p className="text-xs sm:text-sm text-[#595550] max-w-xl mx-auto leading-relaxed">
          Readers of Aurangabad is entirely free and community-sustained. Our future roadmap envisions an open-access physical book library, community reading badges, and literary walking trails across historic Aurangabad.
        </p>
      </section>

    </div>
  );
};
