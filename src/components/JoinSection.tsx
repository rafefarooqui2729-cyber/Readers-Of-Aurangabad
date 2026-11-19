import React, { useState } from 'react';
import { MessageCircle, Check, ArrowRight } from 'lucide-react';
import { Stamp } from './ui/Stamp';
import { Button } from './ui/Button';
import { Eyebrow } from './ui/Eyebrow';
import { siteConfig } from '../content/siteConfig';
import { useApp } from '../context/AppContext';

export const JoinSection: React.FC = () => {
  const { addEnquiry } = useApp();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [genres, setGenres] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Honeypot anti-spam check
    if (honeypot.trim()) {
      // Silently treat as spam bot
      setSubmitted(true);
      return;
    }

    // Basic rate limit check
    const lastSubmitTime = Number(sessionStorage.getItem('roa_last_join_submit') || '0');
    const now = Date.now();
    if (now - lastSubmitTime < 5000) {
      setError('Please wait a few seconds before submitting again.');
      return;
    }

    if (!name.trim() || !contact.trim()) {
      setError('Please enter your name and phone number or Instagram handle.');
      return;
    }

    if (!consent) {
      setError('Please agree to let Readers of Aurangabad contact you regarding meetups.');
      return;
    }

    setLoading(true);
    try {
      sessionStorage.setItem('roa_last_join_submit', String(now));
      await addEnquiry({
        name: name.trim(),
        email: contact.includes('@') ? contact.trim() : `${contact.trim().replace(/[^a-zA-Z0-9]/g, '')}@readers.community`,
        type: 'volunteer',
        message: `New Member Join Request: ${name.trim()}\nPhone / Instagram: ${contact.trim()}\nFavourite Genres: ${genres.trim() || 'General Literature'}`,
        consent: true,
      });

      setSubmitted(true);
      setName('');
      setContact('');
      setGenres('');
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please connect with us directly via WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="join-community"
      className="bg-[#1B2A49] text-[#F4ECDD] py-16 sm:py-24 border-t-2 border-[#1B2A49] relative overflow-hidden"
      aria-label="Join Readers of Aurangabad"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Stamp, Invitation, & Direct WhatsApp Link (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-4">
              <Stamp year={siteConfig.establishedYear} size="md" />
              <div>
                <Eyebrow color="marigold">MH20 INVITATION</Eyebrow>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4ECDD] mt-1 leading-tight">
                  There is a chair saved for you.
                </h2>
              </div>
            </div>

            <p className="font-sans text-base sm:text-lg text-[#D1C5B0] leading-relaxed max-w-xl">
              Readers of Aurangabad is free, volunteer-run, and open to anyone who loves the smell of physical pages. No gatekeeping, no compulsory readings, and no speed tests.
            </p>

            <div className="pt-2">
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#5E7A63] hover:bg-[#4E6752] text-[#F4ECDD] font-sans font-bold text-base tracking-wide px-6 py-3.5 rounded-[4px] transition-colors shadow-sm min-h-[48px]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Join directly via WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
              <span className="block text-xs text-[#D1C5B0] mt-2">
                Active group with Sunday meetup locations, timings, and book discussions.
              </span>
            </div>
          </div>

          {/* Right Column: Three-Field Form with Honeypot & Rate Limiting (6 cols) */}
          <div className="lg:col-span-6">
            <div className="bg-[#243557] border-2 border-[#F4ECDD]/20 rounded-[6px] p-6 sm:p-8">
              <h3 className="font-serif text-2xl font-bold text-[#F4ECDD]">
                Introduce yourself to the circle
              </h3>
              <p className="text-sm text-[#D1C5B0] mt-1 mb-6">
                Fill this quick card or drop by our next gathering in person.
              </p>

              {submitted ? (
                <div className="bg-[#5E7A63]/20 border border-[#5E7A63] p-6 rounded-[4px] text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#5E7A63] text-[#F4ECDD] flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-[#F4ECDD]">
                    Welcome to Readers of Aurangabad!
                  </h4>
                  <p className="text-sm text-[#D1C5B0]">
                    We’ve received your details. Check your phone or Instagram for an invite to our upcoming Sunday chapter.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setSubmitted(false)}
                    className="mt-3"
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot field (hidden from real users) */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website_hp">Leave this empty</label>
                    <input
                      id="website_hp"
                      type="text"
                      name="website_hp"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* 1. Name */}
                  <div>
                    <label htmlFor="join-name" className="block text-xs font-bold uppercase tracking-wider text-[#F4ECDD] mb-1">
                      Your Name <span className="text-[#E8B04A]">*</span>
                    </label>
                    <input
                      id="join-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Asim Khan, Aditi Joshi"
                      className="w-full bg-[#1B2A49] border border-[#F4ECDD]/30 text-[#F4ECDD] placeholder-[#D1C5B0]/50 rounded-[4px] px-4 py-3 text-sm focus:outline-none focus:border-[#E8B04A] focus:ring-1 focus:ring-[#E8B04A]"
                    />
                  </div>

                  {/* 2. Phone or Instagram */}
                  <div>
                    <label htmlFor="join-contact" className="block text-xs font-bold uppercase tracking-wider text-[#F4ECDD] mb-1">
                      Phone Number or Instagram Handle <span className="text-[#E8B04A]">*</span>
                    </label>
                    <input
                      id="join-contact"
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. +91 98765 43210 or @reader_handle"
                      className="w-full bg-[#1B2A49] border border-[#F4ECDD]/30 text-[#F4ECDD] placeholder-[#D1C5B0]/50 rounded-[4px] px-4 py-3 text-sm focus:outline-none focus:border-[#E8B04A] focus:ring-1 focus:ring-[#E8B04A]"
                    />
                  </div>

                  {/* 3. Favourite Genres */}
                  <div>
                    <label htmlFor="join-genres" className="block text-xs font-bold uppercase tracking-wider text-[#F4ECDD] mb-1">
                      Favourite Genres or Current Book (Optional)
                    </label>
                    <input
                      id="join-genres"
                      type="text"
                      value={genres}
                      onChange={(e) => setGenres(e.target.value)}
                      placeholder="e.g. Marathi history, Urdu poetry, Sci-fi, Philosophy"
                      className="w-full bg-[#1B2A49] border border-[#F4ECDD]/30 text-[#F4ECDD] placeholder-[#D1C5B0]/50 rounded-[4px] px-4 py-3 text-sm focus:outline-none focus:border-[#E8B04A] focus:ring-1 focus:ring-[#E8B04A]"
                    />
                  </div>

                  {/* Explicit Consent Checkbox */}
                  <label className="flex items-start gap-3 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded-[2px] accent-[#A8431F] text-[#A8431F] bg-[#1B2A49] border-[#F4ECDD]/40 focus:ring-[#A8431F]"
                    />
                    <span className="text-xs text-[#D1C5B0] leading-snug">
                      I agree that Readers of Aurangabad may use my details to contact me about upcoming reading meetups and community gatherings.
                    </span>
                  </label>

                  {error && (
                    <p className="text-xs text-[#E8B04A] bg-[#1B2A49] border border-[#E8B04A]/40 rounded-[4px] px-3 py-2">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="w-full mt-2"
                  >
                    {loading ? 'Submitting…' : 'Join Readers of Aurangabad'}
                  </Button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
