import React, { useState } from 'react';
import { MessageCircle, Check, ArrowRight } from 'lucide-react';
import { InstagramIcon } from './Icons';
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

  return (
    <section
      id="join-community"
      className="rr-section border-y border-[color:var(--rr-brass)] bg-[color:var(--rr-forest)] text-[color:var(--rr-on-dark)]"
      aria-label="Join Readers of Aurangabad"
    >
      <div className="rr-container">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-7 lg:col-span-6">
            <div className="flex flex-wrap items-start gap-6">
              <div className="[&_.rr-imprint__meta]:text-[color:var(--rr-brass)] [&_.rr-imprint__name]:text-[color:var(--rr-on-dark)] [&_.rr-imprint__rule]:bg-[color:var(--rr-brass)] [&_.rr-imprint__year]:text-[color:var(--rr-brass)]">
                <Stamp year={siteConfig.establishedYear} size="md" />
              </div>
              <div className="min-w-0">
                <Eyebrow color="marigold">MH20 / Open invite</Eyebrow>
                <h2 className="rr-title rr-title--compact mt-4 max-w-[16ch] text-[color:var(--rr-on-dark)]">
                  Bring a book.<br />Meet your people.
                </h2>
              </div>
            </div>

            <p className="max-w-xl border-l border-[color:var(--rr-brass)] pl-5 font-display text-lg italic leading-relaxed text-[color:var(--rr-on-dark)]/85">
              Readers of Aurangabad is free, volunteer-run, and open to anyone who wants to read in good company. No gatekeeping, no compulsory reading list, no pressure.
            </p>

            <div className="border-t border-[color:var(--rr-border)] pt-6">
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rr-btn rr-btn--brass"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Join via WhatsApp</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="rr-meta text-[color:var(--rr-on-dark)]/55">
                  Meetup locations, timings, and community updates.
                </span>
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rr-touch inline-flex items-center gap-2 border-b border-[color:var(--rr-brass)] text-[color:var(--rr-on-dark)]/85 transition-colors hover:text-[color:var(--rr-brass)]"
                >
                  <InstagramIcon className="h-3.5 w-3.5" />
                  <span className="rr-meta">{siteConfig.instagramHandle}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rr-panel bg-[color:var(--rr-paper)] p-6 text-[color:var(--rr-ink)] sm:p-9">
              <div className="border-b border-[color:var(--rr-border)] pb-5">
                <h3 className="rr-title rr-title--small text-[color:var(--rr-ink)]">
                  Introduce yourself
                </h3>
                <p className="rr-body mt-2">
                  Share a few details and we&apos;ll help you find the next chapter.
                </p>
              </div>

              {submitted ? (
                <div className="rr-panel rr-panel--sage mt-6 p-7 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center bg-[color:var(--rr-forest)] text-[color:var(--rr-on-dark)]">
                    <Check className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h4 className="rr-title rr-title--small mt-5 text-[color:var(--rr-forest)]">
                    Welcome to the circle
                  </h4>
                  <p className="rr-body mx-auto mt-2 max-w-sm">
                    We&apos;ve received your details. Watch for an invite to an upcoming gathering.
                  </p>
                  <Button variant="primary" onClick={() => setSubmitted(false)} className="mt-5">
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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

                  <div className="rr-field">
                    <label htmlFor="join-name" className="rr-label">
                      Your name <span className="text-[color:var(--rr-terracotta)]">*</span>
                    </label>
                    <input
                      id="join-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Asim Khan, Aditi Joshi"
                      className="rr-input"
                    />
                  </div>

                  <div className="rr-field">
                    <label htmlFor="join-contact" className="rr-label">
                      Phone or Instagram <span className="text-[color:var(--rr-terracotta)]">*</span>
                    </label>
                    <input
                      id="join-contact"
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. +91 98765 43210 or @reader_handle"
                      className="rr-input"
                    />
                  </div>

                  <div className="rr-field">
                    <label htmlFor="join-genres" className="rr-label">
                      Favourite genres or current book (optional)
                    </label>
                    <input
                      id="join-genres"
                      type="text"
                      value={genres}
                      onChange={(e) => setGenres(e.target.value)}
                      placeholder="e.g. Marathi history, Urdu poetry, sci-fi, philosophy"
                      className="rr-input"
                    />
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 border-t border-[color:var(--rr-border)] pt-5">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[color:var(--rr-terracotta)]"
                    />
                    <span className="rr-body text-xs">
                      I agree that Readers of Aurangabad may use my details to contact me about
                      upcoming reading meetups and community gatherings.
                    </span>
                  </label>

                  {error ? (
                    <p className="rr-alert text-xs" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <Button type="submit" variant="primary" disabled={loading} className="mt-1 w-full">
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
