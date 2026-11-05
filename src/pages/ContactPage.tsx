import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Mail, 
  MapPin, 
  Send, 
  CheckCircle, 
  ArrowUpRight, 
  MessageSquare
} from 'lucide-react';
import { InstagramIcon } from '../components/Icons';

export const ContactPage: React.FC = () => {
  const { addEnquiry } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please provide your name, valid email address, and message.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      addEnquiry({
        type: 'contact',
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        details: { subject: subject.trim() || 'General Inquiry' }
      });

      setIsSubmitting(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 600);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 paper-grain">
      
      {/* 1. HERO HEADER */}
      <section className="pt-6 sm:pt-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E9] border border-[#455240]/20 text-[#2E372B] text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5 text-[#455240]" />
          <span>We'd Love to Hear From You</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1C1B1A] leading-[1.15]">
          Get in Touch
        </h1>

        <p className="text-lg sm:text-xl text-[#595550] font-serif italic max-w-xl mx-auto leading-relaxed">
          "Whether you have a question about our meetups, want to suggest a book, or simply say hello."
        </p>
      </section>

      {/* 2. CONTACT CONTENT GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          
          {/* Left Column: Official Contact Metadata (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="paper-card p-8 rounded-3xl space-y-6 bg-white border border-[#E8E2D5]">
              <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
                The Community Headquarters
              </h3>

              <div className="space-y-5 text-sm">
                
                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8D5B4C] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Location</span>
                    <p className="font-medium text-[#1C1B1A]">Aurangabad (Chhatrapati Sambhajinagar)</p>
                    <p className="text-xs text-[#595550]">Maharashtra 431001, India</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#455240] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Official Inquiries</span>
                    <p className="font-medium text-[#1C1B1A]">contact@readersofaurangabad.com</p>
                    <p className="text-xs text-[#595550]">readersofaurangabad@gmail.com</p>
                  </div>
                </div>

                {/* Instagram */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8D5B4C] shrink-0">
                    <InstagramIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#8C857B] font-semibold block">Official Instagram</span>
                    <a
                      href="https://instagram.com/readers.of.aurangabad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#1C1B1A] hover:text-[#455240] flex items-center gap-1 transition-colors"
                    >
                      <span>@readers.of.aurangabad</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#8D5B4C]" />
                    </a>
                    <p className="text-xs text-[#595550]">Fastest for weekly gathering announcements</p>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-[#F4EFEA] text-xs text-[#8C857B] leading-relaxed">
                <p>
                  <strong>Note on Meetup Registrations:</strong> If you are looking to RSVP for our next Sunday gathering, please head over to the Gatherings page to access the official Google Form.
                </p>
              </div>
            </div>

            {/* Gathering Location Photography */}
            <div className="rounded-2xl overflow-hidden border border-[#E8E2D5] shadow-sm relative group bg-[#1C1B1A]">
              <img
                src="/images/processed/community/contact-venue-lawn.webp"
                alt="Sunday morning gatherings in Aurangabad public parks"
                loading="lazy"
                decoding="async"
                className="w-full h-48 object-cover object-[center_25%] opacity-90 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                <span className="text-white text-xs font-semibold">Historic Grounds & Garden Lawns</span>
                <span className="text-[10px] text-[#E8E2D5]">Where our Sunday chapters assemble</span>
              </div>
            </div>

            {/* Quick Literary Quotation */}
            <div className="p-6 rounded-2xl bg-[#F4EFEA] border border-[#E8E2D5] space-y-2">
              <p className="font-serif italic text-sm text-[#1C1B1A]">
                "In a quiet circle, every voice has weight, and every silence is understood."
              </p>
              <span className="text-[11px] font-semibold text-[#8D5B4C] uppercase tracking-wider block">
                — Readers of MH20
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="paper-card p-8 sm:p-10 rounded-3xl bg-white border border-[#E8E2D5]">
              <h3 className="font-serif text-2xl font-bold text-[#1C1B1A] mb-2">
                Send Us a Note
              </h3>
              <p className="text-sm text-[#595550] mb-6">
                Fill in the form below and a member of the organizing circle will get back to you.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ayesha Siddiqui"
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
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Venue Suggestion / Literary Journal Submission"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B1A] mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A]"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    {error}
                  </p>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-xs text-green-800 bg-green-50 p-3 rounded-xl border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Your message has been received! We will reply via email shortly.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1C1B1A] hover:bg-[#455240] text-white py-3 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Sending your note...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
