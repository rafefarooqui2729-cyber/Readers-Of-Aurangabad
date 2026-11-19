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
    <div className="paper-grain overflow-hidden pb-16">
      <PageHero
        image="/images/enhanced/gallery/roa-054-2026-11-05.webp"
        alt="Readers gathered for a Sunday session in Aurangabad"
        eyebrow="We would love to hear from you"
        title="Get in Touch"
        lead="Whether you have a question about our meetups, want to suggest a book, or simply want to say hello."
      />

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Contact details */}
          <div className="space-y-6 lg:col-span-5">
            <PaperPanel className="rounded-[6px] p-6 sm:p-8">
              <SectionHeading eyebrow="Where to find us" title="The community desk" />
              <dl className="mt-7 space-y-6 font-sans text-sm">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#A8431F]/30 text-[#A8431F]">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5E7A63]">
                      Location
                    </dt>
                    <dd className="mt-1 font-bold text-[#1B2A49] dark:text-[#F4ECDD]">
                      Aurangabad (Chhatrapati Sambhajinagar)
                    </dd>
                    <dd className="text-xs text-[#4B5A77] dark:text-[#D1C5B0]">
                      Maharashtra 431001, India
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#5E7A63]/30 text-[#5E7A63]">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 break-words">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5E7A63]">
                      General enquiries
                    </dt>
                    <dd className="mt-1 font-bold text-[#1B2A49] dark:text-[#F4ECDD]">
                      <a
                        href="mailto:readersofaurangabad@gmail.com"
                        className="inline-flex min-h-[24px] items-center hover:text-[#A8431F] hover:underline"
                      >
                        readersofaurangabad@gmail.com
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#A8431F]/30 text-[#A8431F]">
                    <InstagramIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5E7A63]">
                      Instagram
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={siteConfig.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[24px] items-center gap-1 font-bold text-[#1B2A49] hover:text-[#A8431F] dark:text-[#F4ECDD] dark:hover:text-[#E8B04A]"
                      >
                        {siteConfig.instagramHandle}
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </dd>
                    <dd className="text-xs text-[#4B5A77] dark:text-[#D1C5B0]">
                      Fastest for weekly gathering announcements.
                    </dd>
                  </div>
                </div>
              </dl>
              <p className="mt-7 border-t border-[#1B2A49]/10 pt-5 font-sans text-xs leading-relaxed text-[#4B5A77] dark:border-[#F4ECDD]/10 dark:text-[#D1C5B0]">
                <strong className="text-[#1B2A49] dark:text-[#F4ECDD]">Note on registrations:</strong>{' '}
                To RSVP for the next Sunday gathering, use the official form linked from the
                Gatherings page.
              </p>
            </PaperPanel>

            <div className="relative h-48 overflow-hidden bg-[#1B2A49]">
              <img
                src="/images/enhanced/community/card-2.webp"
                alt="Sunday morning gathering in an Aurangabad public park"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-[center_25%]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1B2A49]/90 to-transparent px-4 pb-4 pt-10">
                <p className="font-sans text-xs font-bold text-[#F4ECDD]">
                  Historic grounds &amp; garden lawns
                </p>
                <p className="font-sans text-[11px] text-[#F4ECDD]/75">
                  Where our Sunday chapters assemble
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <PaperPanel className="rounded-[6px] p-6 sm:p-10">
              <SectionHeading
                eyebrow="Write to us"
                title="Send us a note"
                description="A member of the organizing circle will read your message and reply by email."
              />
              <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="mt-8 space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                <div className="flex items-start gap-3">
                  <input
                    id="contact-consent"
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    aria-invalid={errorField === 'consent' || undefined}
                    aria-describedby={errorField === 'consent' ? 'contact-form-error' : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#A8431F]"
                  />
                  <label
                    htmlFor="contact-consent"
                    className="cursor-pointer select-none font-sans text-xs leading-relaxed text-[#4B5A77] dark:text-[#D1C5B0]"
                  >
                    {'I agree that Readers of Aurangabad may use the information I provide to respond to my enquiry.'}{' '}
                    <span className="text-[#A8431F]">*</span>
                  </label>
                </div>

                {error ? (
                  <p
                    id="contact-form-error"
                    role="alert"
                    aria-live="assertive"
                    className="border border-[#A8431F]/40 bg-[#A8431F]/10 p-3 font-sans text-xs text-[#A8431F]"
                  >
                    {error}
                  </p>
                ) : null}

                {success ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 border border-[#5E7A63]/40 bg-[#5E7A63]/10 p-3 font-sans text-xs text-[#5E7A63] dark:text-[#8BA890]"
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
                      <Send className="mr-2 h-4 w-4" aria-hidden="true" />
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
