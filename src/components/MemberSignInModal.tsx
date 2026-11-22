import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Mail, Lock, Sparkles } from 'lucide-react';
import { useModalEscapeDismiss } from '../utils/modalAccessibility';

interface MemberSignInModalProps {
  open: boolean;
  onClose: () => void;
  onPasswordSignIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onForgotPassword?: (email: string) => Promise<{ ok: boolean; error?: string }>;
}

export const MemberSignInModal: React.FC<MemberSignInModalProps> = ({
  open,
  onClose,
  onPasswordSignIn,
  onMagicLink,
  onForgotPassword,
}) => {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic'>('magic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dismiss = useModalEscapeDismiss(open, onClose, surfaceRef);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'magic') {
        const res = await onMagicLink(email.trim());
        if (res.ok) setSuccess('If an account exists for this email, a secure sign-in link has been sent.');
        else setError(res.error || 'Unable to send sign-in link.');
      } else {
        const res = await onPasswordSignIn(email.trim(), password);
        if (res.ok) {
          setSuccess('Signed in successfully.');
          setTimeout(dismiss, 300);
        } else {
          setError(res.error || 'Unable to sign in.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async () => {
    if (!onForgotPassword) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await onForgotPassword(email.trim());
      if (res.ok) {
        setSuccess('If an account exists for this email, password reset instructions have been sent.');
      } else {
        setError(res.error || 'Unable to send reset instructions.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="p3-modal-overlay fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1 }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <motion.div
        ref={surfaceRef}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        className="p3-modal-surface p3-signin-modal rr-modal relative w-full max-w-md p-6 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-label="Member sign in"
        tabIndex={-1}
      >
        <button type="button" onClick={dismiss} className="p3-icon-button p3-modal-close rr-touch absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-[color:var(--rr-border)] text-[color:var(--rr-muted)] hover:text-[color:var(--rr-ink)] cursor-pointer" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <div className="pr-8">
          <span className="rr-eyebrow">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
            Member notifications
          </span>
          <h2 className="rr-title rr-title--compact mt-5 text-[color:var(--rr-ink)]">Sign in to your community account</h2>
          <p className="rr-body mt-3 text-sm">Receive meetup and announcement updates, and keep your notification read state synced across devices.</p>
        </div>

        <div className="rr-filter-row mt-6 border-b border-[color:var(--rr-border)] pb-4">
          <button type="button" onClick={() => setMode('magic')} aria-pressed={mode === 'magic'} className="rr-filter flex-1 cursor-pointer">Email link</button>
          <button type="button" onClick={() => setMode('password')} aria-pressed={mode === 'password'} className="rr-filter flex-1 cursor-pointer">Password</button>
        </div>

        <form onSubmit={submit} className="p3-form mt-5 space-y-4">
          <label className="rr-field block">
            <span className="rr-label">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--rr-muted)]" aria-hidden="true" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="p3-input rr-input pl-9" placeholder="you@example.com" />
            </span>
          </label>

          {mode === 'password' && (
            <label className="rr-field block">
              <span className="rr-label">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--rr-muted)]" aria-hidden="true" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="p3-input rr-input pl-9" placeholder="Your password" />
              </span>
            </label>
          )}

          {error && <p className="p3-form-error rr-alert text-xs" role="alert">{error}</p>}
          {success && <p className="p3-form-success rr-alert rr-alert--success text-xs">{success}</p>}

          <button type="submit" disabled={loading} className="p3-form-submit rr-btn w-full cursor-pointer disabled:opacity-60">
            {loading ? 'Please wait…' : mode === 'magic' ? 'Send secure sign-in link' : 'Sign in'}
          </button>

          {mode === 'password' && onForgotPassword && (
            <button
              type="button"
              onClick={requestReset}
              disabled={loading || !email.trim()}
              className="p3-text-action rr-link w-full justify-center py-1 text-xs cursor-pointer disabled:opacity-60"
            >
              Forgot password?
            </button>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
};
