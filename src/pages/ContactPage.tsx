import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, MapPin, Send, CheckCircle, ArrowUpRight } from 'lucide-react';
import { InstagramIcon } from '../components/Icons';
import { Button, fieldClasses, FormField, PageHero, PaperPanel, SectionHeading } from '../components/ui';
import { siteConfig } from '../content/siteConfig';

type ContactErrorField = 'name' | 'email' | 'message' | 'consent' | 'form';

export const ContactPage: React.FC = () => {
  const { addEnquiry } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<ContactErrorField | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorField(null);
    setSuccess(false);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorField(!name.trim() ? 'name' : !email.trim() ? 'email' : 'message');
      setError('Please provide your name, valid email address, and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorField('email');
      setError('Please enter a valid email address.');
      return;
    }
    if (!consent) {
      setError('Please agree that Readers of Aurangabad may use your information to respond before submitting.');
      setErrorField('consent');
      return;
    }

    setIsSubmitting(true);

    try {
      await addEnquiry({
        type: 'contact',
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        consent,
        details: { subject: subject.trim() || 'General Inquiry' },
      });
      setIsSubmitting(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setConsent(false);
    } catch (submissionError) {
      setIsSubmitting(false);
      setErrorField('form');
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to submit your message. Please try again.'
      );
    }
  };

  return (
    <div className="rr-home">
      <PageHero
        image="/images/enhanced/gallery/roa-054-2026-11-05.webp"
        alt="Readers gathered for a Sunday session in Aurangabad"
        eyebrow="We would love to hear from you"
        title="Get in Touch"
        lead="Whether you have a question about our meetups, want to suggest a book, or simply want to say hello."
      />

      <section className="rr-section" aria-label="Contact Readers of Aurangabad">
        <div className="rr-container grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Contact details */}
          <div className="lg:col-span-5">
            <p className="rr-eyebrow">Where to find us</p>
            <h2 className="rr-title rr-title--compact mt-4">The community desk</h2>
            <dl className="mt-9 border-t border-[color:var(--rr-border)]">
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-b border-[color:var(--rr-border)] py-6">
                <MapPin className="mt-1 h-5 w-5 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                <div>
                  <dt className="rr-meta text-[color:var(--rr-muted)]">Location</dt>
                  <dd className="mt-2 font-display text-lg leading-tight">
                    Aurangabad (Chhatrapati Sambhajinagar)
                  </dd>
                  <dd className="rr-body mt-1 text-sm">Maharashtra 431001, India</dd>
                </div>
              </div>
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-b border-[color:var(--rr-border)] py-6">
                <Mail className="mt-1 h-5 w-5 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                <div className="min-w-0 break-words">
                  <dt className="rr-meta text-[color:var(--rr-muted)]">General enquiries</dt>
                  <dd className="mt-2 font-display text-lg leading-tight">
                    <a
                      href="mailto:readersofaurangabad@gmail.com"
                      className="rr-link text-left normal-case tracking-normal"
                    >
                      readersofaurangabad@gmail.com
                    </a>
                  </dd>
                </div>
              </div>
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-b border-[color:var(--rr-border)] py-6">
                <InstagramIcon className="mt-1 h-5 w-5 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                <div>
                  <dt className="rr-meta text-[color:var(--rr-muted)]">Instagram</dt>
                  <dd className="mt-2">
                    <a
                      href={siteConfig.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rr-link"
                    >
                      {siteConfig.instagramHandle}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </dd>
                  <dd className="rr-body mt-1 text-sm">Fastest for gathering announcements.</dd>
                </div>
              </div>
            </dl>
            <p className="rr-body mt-8 border-l border-[color:var(--rr-brass)] pl-5 text-sm">
              <strong className="text-[color:var(--rr-ink)]">Note on registrations:</strong>{' '}
              To RSVP for the next gathering, use the official form linked from the
              Gatherings page.
            </p>

            <div className="rr-image mt-10 aspect-[16/9]">
              <img
                src="/images/enhanced/community/card-2.webp"
                alt="Sunday morning gathering in an Aurangabad public park"
                loading="lazy"
                decoding="async"
                className="object-[center_25%]"
              />
              <span className="rr-image-label">Historic grounds &amp; garden lawns</span>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <PaperPanel className="p-7 sm:p-10">
              <SectionHeading
                eyebrow="Write to us"
                title="Send us a note"
                description="A member of the organizing circle will read your message and reply by email."
              />
              <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="mt-9 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField id="contact-name" label="Your name" required invalid={errorField === 'name'}>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      aria-invalid={errorField === 'name' || undefined}
                      aria-describedby={errorField === 'name' ? 'contact-form-error' : undefined}
                      className={fieldClasses}
                    />
                  </FormField>
                  <FormField id="contact-email" label="Email address" required invalid={errorField === 'email'}>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      aria-invalid={errorField === 'email' || undefined}
                      aria-describedby={errorField === 'email' ? 'contact-form-error' : undefined}
                      className={fieldClasses}
                    />
                  </FormField>
                </div>
                <FormField id="contact-subject" label="Subject / topic">
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Venue suggestion / journal submission"
                    className={fieldClasses}
                  />
                </FormField>
                <FormField id="contact-message" label="Message" required invalid={errorField === 'message'}>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    aria-invalid={errorField === 'message' || undefined}
                    aria-describedby={errorField === 'message' ? 'contact-form-error' : undefined}
                    className={fieldClasses}
                  />
                </FormField>
                <div className="flex items-start gap-3 border-t border-[color:var(--rr-border)] pt-6">
                  <input
                    id="contact-consent"
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    aria-invalid={errorField === 'consent' || undefined}
                    aria-describedby={errorField === 'consent' ? 'contact-form-error' : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[color:var(--rr-terracotta)]"
                  />
                  <label
                    htmlFor="contact-consent"
                    className="cursor-pointer select-none font-sans text-xs leading-relaxed text-[color:var(--rr-muted)]"
                  >
                    {'I agree that Readers of Aurangabad may use the information I provide to respond to my enquiry.'}{' '}
                    <span className="text-[color:var(--rr-terracotta)]">*</span>
                  </label>
                </div>

                {error ? (
                  <p
                    id="contact-form-error"
                    role="alert"
                    aria-live="assertive"
                    className="rr-alert"
                  >
                    {error}
                  </p>
                ) : null}

                {success ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rr-alert rr-alert--success flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Your message has been received! We will reply via email shortly.</span>
                  </div>
                ) : null}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <span>Sending your note...</span>
                  ) : (
                    <>
                      <Send className="h-4 w-4" aria-hidden="true" />
                      Send message
                    </>
                  )}
                </Button>
              </form>
            </PaperPanel>
          </div>
        </div>
      </section>
    </div>
  );
};
