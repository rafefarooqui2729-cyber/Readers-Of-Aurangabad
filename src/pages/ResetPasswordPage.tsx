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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 paper-grain">
      <motion.div
        {...cardMotion}
        className="p3-recovery-card glass-card max-w-md w-full p-8 sm:p-10 rounded-3xl relative overflow-hidden border-[#D8CBFF]/25 shadow-[var(--mh20-shadow-lg)]"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#24262D]/10 flex items-center justify-center mb-5">
          <ShieldCheck className="w-6 h-6 text-[#24262D]" />
        </div>

        <h1
          className="text-2xl sm:text-3xl font-bold text-[#24262D]"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
        >
          {stage === 'success' ? 'Password updated' : 'Set a new password'}
        </h1>

        {stage === 'verifying' && (
          <p className="mt-3 text-sm text-[#5E5B55]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Verifying your recovery link…
          </p>
        )}

        {stage === 'ready' && (
          <>
            <p className="mt-2 text-sm text-[#5E5B55]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Choose a password of at least {MIN_PASSWORD_LENGTH} characters. You will be signed out
              after the change so you can sign in with the new password.
            </p>

            <form onSubmit={handleSubmit} aria-busy={submitting} className="p3-form p3-recovery-form mt-6 space-y-4" noValidate>
              <label htmlFor="recovery-new-password" className="block">
                <span className="text-xs font-semibold text-[#24262D]">New password</span>
                <div className="mt-1 relative">
                  <Lock className="w-4 h-4 text-[#5E5B55] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="recovery-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p3-input w-full pl-9 pr-11 py-2.5 rounded-xl glass-input text-sm"
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
                    className="p3-icon-button absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-[#F7F3EB] flex items-center justify-center cursor-pointer"
                    aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-[#5E5B55]" /> : <Eye className="w-4 h-4 text-[#5E5B55]" />}
                  </button>
                </div>
              </label>

              <label htmlFor="recovery-confirm-password" className="block">
                <span className="text-xs font-semibold text-[#24262D]">Confirm new password</span>
                <div className="mt-1 relative">
                  <Lock className="w-4 h-4 text-[#5E5B55] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="recovery-confirm-password"
                    type={showConfirmation ? 'text' : 'password'}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="p3-input w-full pl-9 pr-11 py-2.5 rounded-xl glass-input text-sm"
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
                    className="p3-icon-button absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-[#F7F3EB] flex items-center justify-center cursor-pointer"
                    aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'}
                  >
                    {showConfirmation ? <EyeOff className="w-4 h-4 text-[#5E5B55]" /> : <Eye className="w-4 h-4 text-[#5E5B55]" />}
                  </button>
                </div>
              </label>

              {error && (
                <p id="recovery-form-error" role="alert" aria-live="assertive" className="p3-form-error text-xs text-red-700 bg-[#F47B49]/15 border border-[#F47B49]/45 rounded-xl px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="p3-form-submit w-full glass-button px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Updating password…' : 'Update password'}
              </button>

              <button
                type="button"
                onClick={handleReturnToSignIn}
                className="w-full text-xs text-[#5E5B55] hover:text-[#24262D] flex items-center justify-center gap-1.5 py-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cancel and return to the site
              </button>
            </form>
          </>
        )}

        {stage === 'success' && (
          <div className="mt-4">
            <div role="status" aria-live="polite" className="p3-form-success flex items-start gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Your password has been updated. Sign in again with your new password.</span>
            </div>
            <button
              type="button"
              onClick={handleReturnToSignIn}
              className="p3-form-submit mt-5 w-full glass-button px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
            >
              Return to sign in
            </button>
          </div>
        )}

        {stage === 'invalid' && (
          <div className="mt-4">
            <div className="p3-form-warning flex items-start gap-2 text-sm text-[#24262D] bg-[#FFD8C1]/45 border border-[#FFD8C1] rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>This password reset link is invalid or has expired. Request a new link below.</span>
            </div>

            <form onSubmit={handleRequestLink} aria-busy={requestState === 'sending'} className="p3-form p3-recovery-form mt-5 space-y-3" noValidate>
              <label htmlFor="recovery-request-email" className="block">
                <span className="text-xs font-semibold text-[#24262D]">Account email</span>
                <div className="mt-1 relative">
                  <Mail className="w-4 h-4 text-[#5E5B55] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="recovery-request-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="p3-input w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm"
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-label="Account email"
                    aria-invalid={Boolean(requestError) || undefined}
                    aria-describedby={requestError ? 'recovery-request-error' : undefined}
                    required
                  />
                </div>
              </label>

              {requestError && (
                <p id="recovery-request-error" role="alert" aria-live="assertive" className="p3-form-error text-xs text-red-700 bg-[#F47B49]/15 border border-[#F47B49]/45 rounded-xl px-3 py-2">
                  {requestError}
                </p>
              )}

              {requestState === 'sent' && (
                <p role="status" aria-live="polite" className="p3-form-success text-xs text-green-800 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  {GENERIC_RESET_REQUEST_MESSAGE}
                </p>
              )}

              <button
                type="submit"
                disabled={requestState === 'sending'}
                className="p3-form-submit w-full glass-button px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {requestState === 'sending' ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleReturnToSignIn}
              className="mt-4 w-full text-xs text-[#5E5B55] hover:text-[#24262D] flex items-center justify-center gap-1.5 py-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to the site
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
