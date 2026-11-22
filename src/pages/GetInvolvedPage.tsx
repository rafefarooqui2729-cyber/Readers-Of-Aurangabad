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
  ExternalLink,
} from 'lucide-react';
import { InstagramIcon } from '../components/Icons';
import { siteConfig } from '../content/siteConfig';
import { isMeetupUpcoming } from '../utils/meetupStatus';
import { getSafeRegistrationUrl } from '../utils/url';
import {
  Button,
  fieldClasses,
  FilterButton,
  FormField,
  PageHero,
  SectionHeading,
} from '../components/ui';

type InvolvedErrorField = 'name' | 'email' | 'message' | 'consent' | 'form';

export const GetInvolvedPage: React.FC = () => {
  const { addEnquiry, meetups, setCurrentPage } = useApp();
  const [activeTab, setActiveTab] = useState<EnquiryType>('volunteer');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const [volunteerSkills, setVolunteerSkills] = useState('');
  const [bookDetails, setBookDetails] = useState('');
  const [collabOrg, setCollabOrg] = useState('');
  const [collabType, setCollabType] = useState('Café / Venue Partner');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorField, setErrorField] = useState<InvolvedErrorField | null>(null);

  const upcomingMeetup = meetups.find((m) => isMeetupUpcoming(m));
  const registrationUrl = upcomingMeetup ? getSafeRegistrationUrl(upcomingMeetup) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorField(null);
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorField(!name.trim() ? 'name' : !email.trim() ? 'email' : 'message');
      setErrorMessage('Please fill in your name, email address, and a short message.');
      return;
    }
    if (!consent) {
      setErrorMessage(
        'Please agree that Readers of Aurangabad may use your information to respond before submitting.'
      );
      setErrorField('consent');
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

    try {
      await addEnquiry({
        type: activeTab,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        consent,
        details,
      });
      setIsSubmitting(false);
      setSuccessMessage(
        'Your expression of interest has been safely recorded. Our team will reach out to you shortly.'
      );

      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setVolunteerSkills('');
      setBookDetails('');
      setCollabOrg('');
      setConsent(false);
    } catch (submissionError) {
      setIsSubmitting(false);
      setErrorField('form');
      setErrorMessage(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to submit your form. Please try again.'
      );
    }
  };

  const selectTab = (tab: EnquiryType) => {
    setActiveTab(tab);
    setSuccessMessage('');
    setErrorMessage('');
    setErrorField(null);
  };

  const callout =
    activeTab === 'volunteer'
      ? 'Help with gathering setup, photographing real meetup moments, or sharing announcements.'
      : activeTab === 'book_donation'
      ? 'We accept good-condition fiction, non-fiction, poetry, and educational books across English, Marathi, Hindi, and Urdu.'
      : 'Are you a local café, independent bookstore, college literary club, or cultural institution in Aurangabad? Let’s organize a joint gathering.';

  return (
    <div className="rr-home">
      <PageHero
        image="/images/enhanced/gallery/roa-060-2026-11-05.webp"
        alt="Readers exchanging books at an Aurangabad gathering"
        eyebrow="Participate in the movement"
        title="Get Involved"
        lead="A reading movement flourishes through the hands that lay out mats, share books, and welcome strangers."
      />

      {/* Quick ways in — two numbered entries in an editorial ledger. */}
      <section className="rr-section" aria-label="Start here">
        <div className="rr-container">
          <SectionHeading
            eyebrow="Start here"
            title="Two easy ways to join in"
            description="Follow the announcements, or come and sit with us at the next gathering."
          />
          <div className="mt-10 border-t border-[color:var(--rr-border)]">
            <article className="grid gap-7 border-b border-[color:var(--rr-border)] py-9 lg:grid-cols-[4rem_minmax(0,1fr)_auto] lg:items-start lg:gap-12">
              <span className="rr-meta pt-1 text-[color:var(--rr-brass)]">01</span>
              <div className="max-w-2xl">
                <InstagramIcon className="h-6 w-6 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                <h3 className="rr-title rr-title--compact mt-5">Join the conversation online</h3>
                <p className="rr-body mt-4">
                  Follow our Instagram for gathering announcements, venue updates, book excerpts,
                  and community spotlights.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:pt-1">
                <Button
                  asAnchor
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs"
                >
                  <InstagramIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Follow {siteConfig.instagramHandle}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Button>
                <Button
                  asAnchor
                  variant="secondary"
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Join the WhatsApp group
                </Button>
              </div>
            </article>

            <article className="grid gap-7 border-b border-[color:var(--rr-border)] py-9 lg:grid-cols-[4rem_minmax(0,1fr)_auto] lg:items-start lg:gap-12">
              <span className="rr-meta pt-1 text-[color:var(--rr-brass)]">02</span>
              <div className="max-w-2xl">
                <BookOpen className="h-6 w-6 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
                <h3 className="rr-title rr-title--compact mt-5">Attend a gathering</h3>
                <p className="rr-body mt-4">
                  Gatherings are free and open to all. Join our WhatsApp group to hear about the next
                  chapter and confirm your plans.
                </p>
              </div>
              <div className="lg:pt-1">
                {upcomingMeetup && upcomingMeetup.registrationStatus === 'open' && registrationUrl ? (
                  <Button
                    asAnchor
                    href={registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs"
                  >
                    RSVP for the next chapter
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                ) : upcomingMeetup && upcomingMeetup.registrationStatus === 'open' ? (
                  <Button
                    asAnchor
                    variant="secondary"
                    href={siteConfig.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Ask on WhatsApp
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentPage('gatherings')}
                    className="rr-link"
                  >
                    Check the gathering archive
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Enquiry form */}
      <section className="rr-section rr-section--line" aria-label="Offer a hand">
        <div className="rr-container max-w-4xl">
          <SectionHeading
            eyebrow="Offer a hand"
            title="Connect your passion with the circle"
            description="Choose how you would like to participate and tell us a little about yourself."
            center
          />

          <div
            className="rr-filter-row mt-10 justify-center"
            role="group"
            aria-label="How would you like to help?"
          >
            <FilterButton active={activeTab === 'volunteer'} onClick={() => selectTab('volunteer')}>
              Volunteer
            </FilterButton>
            <FilterButton
              active={activeTab === 'book_donation'}
              onClick={() => selectTab('book_donation')}
            >
              Donate books
            </FilterButton>
            <FilterButton
              active={activeTab === 'collaboration'}
              onClick={() => selectTab('collaboration')}
            >
              Collaborate
            </FilterButton>
          </div>

          <p className="rr-alert mt-8">{callout}</p>

          <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField id="involved-name" label="Full name" required invalid={errorField === 'name'}>
                <input
                  id="involved-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  aria-invalid={errorField === 'name' || undefined}
                  aria-describedby={errorField === 'name' ? 'involved-form-error' : undefined}
                  className={fieldClasses}
                />
              </FormField>
              <FormField id="involved-email" label="Email address" required invalid={errorField === 'email'}>
                <input
                  id="involved-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  aria-invalid={errorField === 'email' || undefined}
                  aria-describedby={errorField === 'email' ? 'involved-form-error' : undefined}
                  className={fieldClasses}
                />
              </FormField>
            </div>

            <FormField id="involved-phone" label="WhatsApp / phone (optional)">
              <input
                id="involved-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className={fieldClasses}
              />
            </FormField>

            {activeTab === 'volunteer' ? (
              <FormField id="volunteer-skills" label="How would you like to help?">
                <input
                  id="volunteer-skills"
                  type="text"
                  value={volunteerSkills}
                  onChange={(e) => setVolunteerSkills(e.target.value)}
                  placeholder="Event photography, park coordination, poster design"
                  className={fieldClasses}
                />
              </FormField>
            ) : null}

            {activeTab === 'book_donation' ? (
              <FormField id="book-details" label="Approximate quantity & genres">
                <input
                  id="book-details"
                  type="text"
                  value={bookDetails}
                  onChange={(e) => setBookDetails(e.target.value)}
                  placeholder="15 Marathi novels and 10 English paperbacks"
                  className={fieldClasses}
                />
              </FormField>
            ) : null}

            {activeTab === 'collaboration' ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField id="collab-org" label="Organization / café name">
                  <input
                    id="collab-org"
                    type="text"
                    value={collabOrg}
                    onChange={(e) => setCollabOrg(e.target.value)}
                    placeholder="Your organization"
                    className={fieldClasses}
                  />
                </FormField>
                <FormField id="collab-type" label="Partner category">
                  <select
                    id="collab-type"
                    value={collabType}
                    onChange={(e) => setCollabType(e.target.value)}
                    className={fieldClasses}
                  >
                    <option value="Café / Venue Partner">Café / Venue Partner</option>
                    <option value="Bookstore / Publisher">Bookstore / Publisher</option>
                    <option value="College / University Society">College / University Society</option>
                    <option value="Cultural / Literary NGO">Cultural / Literary NGO</option>
                  </select>
                </FormField>
              </div>
            ) : null}

            <FormField id="involved-message" label="Your message" required invalid={errorField === 'message'}>
              <textarea
                id="involved-message"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us a little about yourself and why you would like to help..."
                aria-invalid={errorField === 'message' || undefined}
                aria-describedby={errorField === 'message' ? 'involved-form-error' : undefined}
                className={fieldClasses}
              />
            </FormField>

            <div className="flex items-start gap-3 border-t border-[color:var(--rr-border)] pt-6">
              <input
                id="get-involved-consent"
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-invalid={errorField === 'consent' || undefined}
                aria-describedby={errorField === 'consent' ? 'involved-form-error' : undefined}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[color:var(--rr-terracotta)]"
              />
              <label
                htmlFor="get-involved-consent"
                className="cursor-pointer select-none font-sans text-xs leading-relaxed text-[color:var(--rr-muted)]"
              >
                {'I agree that Readers of Aurangabad may use the information I provide to respond to my enquiry.'}{' '}
                <span className="text-[color:var(--rr-terracotta)]">*</span>
              </label>
            </div>

            {errorMessage ? (
              <p
                id="involved-form-error"
                role="alert"
                aria-live="assertive"
                className="rr-alert"
              >
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <div
                role="status"
                aria-live="polite"
                className="rr-alert rr-alert--success flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{successMessage}</span>
              </div>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <span>Submitting your note...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Submit expression of interest
                </>
              )}
            </Button>
          </form>
        </div>
      </section>

      <section className="rr-cta-band" aria-label="A community reading sanctuary">
        <div className="rr-container rr-cta-band__inner">
          <div>
            <HandHeart className="h-6 w-6 text-[color:var(--rr-brass)]" aria-hidden="true" />
            <h2 className="rr-cta-band__title">A community reading sanctuary</h2>
            <p className="rr-cta-band__copy">
              Readers of Aurangabad is free and community-sustained. Our hopes for the future include
              an open-access book shelf, shared reading badges, and literary walks across historic
              Aurangabad.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
