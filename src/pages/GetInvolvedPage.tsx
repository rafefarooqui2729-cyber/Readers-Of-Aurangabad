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
  PaperPanel,
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
      ? 'Help with Sunday morning setup, photographing real meetup moments, or sharing announcements.'
      : activeTab === 'book_donation'
      ? 'We accept good-condition fiction, non-fiction, poetry, and educational books across English, Marathi, Hindi, and Urdu.'
      : 'Are you a local café, independent bookstore, college literary club, or cultural institution in Aurangabad? Let’s organize a joint gathering.';

  return (
    <div className="paper-grain overflow-hidden pb-16">
      <PageHero
        image="/images/enhanced/gallery/roa-060-2026-11-05.webp"
        alt="Readers exchanging books at an Aurangabad gathering"
        eyebrow="Participate in the movement"
        title="Get Involved"
        lead="A reading movement flourishes through the hands that lay out mats, share books, and welcome strangers."
      />

      <div className="space-y-12 sm:space-y-16">
        {/* Quick ways in */}
        <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14 lg:px-12">
          <SectionHeading
            eyebrow="Start here"
            title="Two easy ways to join in"
            description="Follow the announcements, or come and sit with us at the next Sunday chapter."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <PaperPanel className="flex h-full flex-col p-6 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center border border-[#A8431F]/30 text-[#A8431F]">
                <InstagramIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold text-[#1B2A49] dark:text-[#F4ECDD]">
                Join the conversation online
              </h3>
              <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-[#4B5A77] dark:text-[#D1C5B0]">
                Follow our Instagram for weekly Sunday announcements, venue updates, book excerpts,
                and community spotlights.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asAnchor
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs"
                >
                  <InstagramIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Follow {siteConfig.instagramHandle}
                  <ExternalLink className="ml-2 h-3 w-3" aria-hidden="true" />
                </Button>
                <Button
                  asAnchor
                  variant="secondary"
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs"
                >
                  <MessageCircle className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Join the WhatsApp group
                </Button>
              </div>
            </PaperPanel>

            <PaperPanel className="flex h-full flex-col p-6 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center border border-[#5E7A63]/30 text-[#5E7A63]">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold text-[#1B2A49] dark:text-[#F4ECDD]">
                Attend a gathering
              </h3>
              <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-[#4B5A77] dark:text-[#D1C5B0]">
                Gatherings are free and open to all. Join our WhatsApp group to hear about the next
                chapter and confirm your plans.
              </p>
              <div className="mt-6">
                {upcomingMeetup && upcomingMeetup.registrationStatus === 'open' && registrationUrl ? (
                  <Button
                    asAnchor
                    href={registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs"
                  >
                    RSVP for the next chapter
                    <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
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
                    <MessageCircle className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    Ask on WhatsApp
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentPage('gatherings')}
                    className="inline-flex min-h-[44px] items-center gap-2 font-sans text-xs font-bold text-[#A8431F] underline underline-offset-4"
                  >
                    Check the gathering archive
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </PaperPanel>
          </div>
        </section>

        {/* Enquiry form */}
        <section className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-12">
          <PaperPanel className="rounded-[6px] p-6 sm:p-10">
            <SectionHeading
              eyebrow="Offer a hand"
              title="Connect your passion with the circle"
              description="Choose how you would like to participate and tell us a little about yourself."
              center
            />

            <div
              className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-3"
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

            <p className="mt-6 border-l-4 border-[#E8B04A] bg-[#F4ECDD] px-4 py-3 font-sans text-xs leading-relaxed text-[#4B5A77] dark:bg-[#1B2A49] dark:text-[#D1C5B0]">
              {callout}
            </p>

            <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="mt-8 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

              <div className="flex items-start gap-3">
                <input
                  id="get-involved-consent"
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-invalid={errorField === 'consent' || undefined}
                  aria-describedby={errorField === 'consent' ? 'involved-form-error' : undefined}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#A8431F]"
                />
                <label
                  htmlFor="get-involved-consent"
                  className="cursor-pointer select-none font-sans text-xs leading-relaxed text-[#4B5A77] dark:text-[#D1C5B0]"
                >
                  {'I agree that Readers of Aurangabad may use the information I provide to respond to my enquiry.'}{' '}
                  <span className="text-[#A8431F]">*</span>
                </label>
              </div>

              {errorMessage ? (
                <p
                  id="involved-form-error"
                  role="alert"
                  aria-live="assertive"
                  className="border border-[#A8431F]/40 bg-[#A8431F]/10 p-3 font-sans text-xs text-[#A8431F]"
                >
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 border border-[#5E7A63]/40 bg-[#5E7A63]/10 p-3 font-sans text-xs text-[#5E7A63] dark:text-[#8BA890]"
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
                    <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                    Submit expression of interest
                  </>
                )}
              </Button>
            </form>
          </PaperPanel>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-4 text-center sm:px-8">
          <HandHeart className="mx-auto h-7 w-7 text-[#A8431F]" aria-hidden="true" />
          <h3 className="mt-4 font-display text-2xl font-bold text-[#1B2A49] dark:text-[#F4ECDD]">
            A community reading sanctuary
          </h3>
          <p className="mx-auto mt-3 max-w-xl font-sans text-sm leading-relaxed text-[#4B5A77] dark:text-[#D1C5B0]">
            Readers of Aurangabad is free and community-sustained. Our hopes for the future include
            an open-access book shelf, shared reading badges, and literary walks across historic
            Aurangabad.
          </p>
        </section>
      </div>
    </div>
  );
};
