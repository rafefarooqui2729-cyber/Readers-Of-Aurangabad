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

    if (honeypot.trim()) {
      setSubmitted(true);
      return;
    }

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

  const inputClassName =
    'w-full bg-[#171717] border-2 border-[#F4F0E8]/35 text-[#F4F0E8] placeholder-[#B8B2A8] rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#D9F36A] focus:shadow-[4px_4px_0_rgba(217,243,106,0.2)]';

  return (
    <section
      id="join-community"
      className="relative overflow-hidden border-y-[3px] border-[#171717] bg-[#171717] py-16 text-[#F4F0E8] sm:py-24 dark:border-[#D9F36A]"
      aria-label="Join Readers of Aurangabad"
    >
      <div className="absolute left-0 top-0 h-2 w-full bg-[#F4512C]" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <div className="flex flex-wrap items-start gap-4">
              <Stamp year={siteConfig.establishedYear} size="md" className="!rotate-0" />
              <div>
                <Eyebrow color="marigold">MH20 invitation</Eyebrow>
                <h2 className="mt-2 font-display text-4xl uppercase leading-[0.92] tracking-[-0.03em] text-[#F4F0E8] sm:text-5xl">
                  Pull up a chair. Bring a book.
                </h2>
              </div>
            </div>

            <p className="max-w-xl border-l-4 border-[#D9F36A] pl-4 font-serif text-lg italic leading-relaxed text-[#F4F0E8]/92">
              Readers of Aurangabad is free, volunteer-run, and open to anyone who loves physical
              books and real conversation. No gatekeeping, no compulsory reading list, no speed tests.
            </p>

            <div className="pt-2">
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center gap-3 border-2 border-[#F4F0E8] bg-[#25D366] px-6 py-3.5 font-sans text-sm font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_#000] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_#000]"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                <span>Join via WhatsApp</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <span className="mt-3 block text-xs text-[#B8B2A8]">
                Sunday meetup locations, timings, and community updates.
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="border-2 border-[#F4F0E8]/30 bg-[#202020] p-6 shadow-[8px_8px_0_#000] sm:p-8">
              <h3 className="font-display text-2xl uppercase tracking-[-0.02em] text-[#F4F0E8]">
                Introduce yourself
              </h3>
              <p className="mt-2 text-sm text-[#D6D0C6]">
                Share a few details and we&apos;ll help you find the next chapter.
              </p>

              {submitted ? (
                <div className="mt-6 border-2 border-[#D9F36A] bg-[#171717] p-6 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center border-2 border-[#171717] bg-[#D9F36A] text-[#171717]">
                    <Check className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h4 className="mt-4 font-display text-xl uppercase tracking-[-0.02em] text-[#F4F0E8]">
                    Welcome to the circle
                  </h4>
                  <p className="mt-2 text-sm text-[#D6D0C6]">
                    We&apos;ve received your details. Watch for an invite to an upcoming Sunday chapter.
                  </p>
                  <Button variant="primary" onClick={() => setSubmitted(false)} className="mt-4">
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

                  <div>
                    <label htmlFor="join-name" className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#F4F0E8]">
                      Your name <span className="text-[#F4512C]">*</span>
                    </label>
                    <input
                      id="join-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Asim Khan, Aditi Joshi"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label htmlFor="join-contact" className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#F4F0E8]">
                      Phone or Instagram <span className="text-[#F4512C]">*</span>
                    </label>
                    <input
                      id="join-contact"
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. +91 98765 43210 or @reader_handle"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label htmlFor="join-genres" className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-[#F4F0E8]">
                      Favourite genres or current book (optional)
                    </label>
                    <input
                      id="join-genres"
                      type="text"
                      value={genres}
                      onChange={(e) => setGenres(e.target.value)}
                      placeholder="e.g. Marathi history, Urdu poetry, sci-fi, philosophy"
                      className={inputClassName}
                    />
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 pt-1">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#F4512C]"
                    />
                    <span className="text-xs leading-relaxed text-[#D6D0C6]">
                      I agree that Readers of Aurangabad may use my details to contact me about
                      upcoming reading meetups and community gatherings.
                    </span>
                  </label>

                  {error ? (
                    <p className="border-2 border-[#F4512C] bg-[#171717] px-3 py-2 text-xs text-[#FFD5C8]">
                      {error}
                    </p>
                  ) : null}

                  <Button type="submit" variant="primary" disabled={loading} className="mt-2 w-full">
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
