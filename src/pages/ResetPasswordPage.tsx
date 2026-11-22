import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import {
  GENERIC_RESET_REQUEST_MESSAGE,
  MIN_PASSWORD_LENGTH,
  detectRecoveryIntent,
  isValidRecoveryEmail,
  normalizeRecoveryError,
  validateNewPassword,
} from '../utils/authRecovery';

type RecoveryStage = 'verifying' | 'ready' | 'invalid' | 'success';

/**
 * Password recovery interface.
 *
 * Only reachable when the app detected a recovery intent (`type=recovery` in the
 * URL) or received a Supabase `PASSWORD_RECOVERY` event. The form additionally
 * requires a live recovery session, so an anonymous visitor cannot use it.
 */
export const ResetPasswordPage: React.FC = () => {
  const {
    isPasswordRecovery,
    currentUserEmail,
    updatePassword,
    requestPasswordReset,
    completePasswordRecovery,
    setCurrentPage,
  } = useApp();

  const shouldReduceMotion = useReducedMotion() ?? false;

  const [stage, setStage] = useState<RecoveryStage>('verifying');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [resetEmail, setResetEmail] = useState(currentUserEmail ?? '');
  const [requestState, setRequestState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    let active = true;

    const resolveRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const hasRecoveryIntent = isPasswordRecovery
        || detectRecoveryIntent(window.location.hash, window.location.search);

      setStage(data.session && hasRecoveryIntent ? 'ready' : 'invalid');
    };

    void resolveRecoverySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        setStage('ready');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isPasswordRecovery]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError('');
    const validation = validateNewPassword(password, confirmation);
    if (!validation.ok) {
      setError(validation.error ?? 'Check the password fields.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (!result.ok) {
        setError(normalizeRecoveryError(result.error));
        return;
      }
      setPassword('');
      setConfirmation('');
      setShowPassword(false);
      setShowConfirmation(false);
      setStage('success');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToSignIn = async () => {
    await completePasswordRecovery();
    setCurrentPage('home');
  };

  const handleRequestLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requestState === 'sending') return;

    setRequestError('');
    if (!isValidRecoveryEmail(resetEmail)) {
      setRequestError('Enter a valid email address.');
      return;
    }

    setRequestState('sending');
    const result = await requestPasswordReset(resetEmail);
    if (!result.ok) {
      setRequestState('idle');
      setRequestError(result.error || 'Unable to send reset instructions right now.');
      return;
    }
    setRequestState('sent');
  };

  const cardMotion = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="rr-home">
      <section className="rr-container flex min-h-[85vh] items-center justify-center py-16" aria-label="Account recovery">
        <motion.div {...cardMotion} className="w-full max-w-xl">
          <div className="rr-panel p-8 sm:p-12">
            <p className="rr-eyebrow">Account recovery · MH20</p>
            <ShieldCheck className="mt-8 h-6 w-6 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
            <h1 className="rr-title rr-title--compact mt-5">
              {stage === 'success' ? 'Password updated' : 'Set a new password'}
            </h1>
            <div className="rr-rule mt-8" aria-hidden="true" />

            {stage === 'verifying' && (
              <p className="rr-side-note mt-8">Verifying your recovery link…</p>
            )}

            {stage === 'ready' && (
              <>
                <p className="rr-body mt-8">
                  Choose a password of at least {MIN_PASSWORD_LENGTH} characters. You will be signed out
                  after the change so you can sign in with the new password.
                </p>

                <form onSubmit={handleSubmit} aria-busy={submitting} className="mt-9 space-y-6" noValidate>
                  <div className="rr-field">
                    <label htmlFor="recovery-new-password" className="rr-label">New password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--rr-muted)]" aria-hidden="true" />
                      <input
                        id="recovery-new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rr-input pl-11 pr-12"
                        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        aria-label="New password"
                        aria-invalid={Boolean(error) || undefined}
                        aria-describedby={error ? 'recovery-form-error' : undefined}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="rr-touch absolute right-1 top-1/2 flex -translate-y-1/2 items-center justify-center border border-[color:var(--rr-border)] px-2"
                        aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="rr-field">
                    <label htmlFor="recovery-confirm-password" className="rr-label">Confirm new password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--rr-muted)]" aria-hidden="true" />
                      <input
                        id="recovery-confirm-password"
                        type={showConfirmation ? 'text' : 'password'}
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        className="rr-input pl-11 pr-12"
                        placeholder="Repeat the new password"
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        aria-label="Confirm new password"
                        aria-invalid={Boolean(error) || undefined}
                        aria-describedby={error ? 'recovery-form-error' : undefined}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmation((prev) => !prev)}
                        className="rr-touch absolute right-1 top-1/2 flex -translate-y-1/2 items-center justify-center border border-[color:var(--rr-border)] px-2"
                        aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'}
                      >
                        {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p id="recovery-form-error" role="alert" aria-live="assertive" className="rr-alert flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rr-btn w-full disabled:opacity-60"
                  >
                    {submitting ? 'Updating password…' : 'Update password'}
                  </button>

                  <button
                    type="button"
                    onClick={handleReturnToSignIn}
                    className="rr-link w-full justify-center"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Cancel and return to the site
                  </button>
                </form>
              </>
            )}

            {stage === 'success' && (
              <div className="mt-8">
                <div role="status" aria-live="polite" className="rr-alert rr-alert--success flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Your password has been updated. Sign in again with your new password.</span>
                </div>
                <button
                  type="button"
                  onClick={handleReturnToSignIn}
                  className="rr-btn mt-6 w-full"
                >
                  Return to sign in
                </button>
              </div>
            )}

            {stage === 'invalid' && (
              <div className="mt-8">
                <div className="rr-alert flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>This password reset link is invalid or has expired. Request a new link below.</span>
                </div>

                <form onSubmit={handleRequestLink} aria-busy={requestState === 'sending'} className="mt-8 space-y-6" noValidate>
                  <div className="rr-field">
                    <label htmlFor="recovery-request-email" className="rr-label">Account email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--rr-muted)]" aria-hidden="true" />
                      <input
                        id="recovery-request-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="rr-input pl-11"
                        placeholder="you@example.com"
                        autoComplete="email"
                        aria-label="Account email"
                        aria-invalid={Boolean(requestError) || undefined}
                        aria-describedby={requestError ? 'recovery-request-error' : undefined}
                        required
                      />
                    </div>
                  </div>

                  {requestError && (
                    <p id="recovery-request-error" role="alert" aria-live="assertive" className="rr-alert">
                      {requestError}
                    </p>
                  )}

                  {requestState === 'sent' && (
                    <p role="status" aria-live="polite" className="rr-alert rr-alert--success">
                      {GENERIC_RESET_REQUEST_MESSAGE}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={requestState === 'sending'}
                    className="rr-btn w-full disabled:opacity-60"
                  >
                    {requestState === 'sending' ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleReturnToSignIn}
                  className="rr-link mt-8 w-full justify-center"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Back to the site
                </button>
              </div>
            )}
          </div>
          <p className="rr-meta mt-6 text-center text-[color:var(--rr-muted)]">
            Readers of Aurangabad · MH20 City Reading Collective
          </p>
        </motion.div>
      </section>
    </div>
  );
};
