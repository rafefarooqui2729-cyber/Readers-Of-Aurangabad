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
      className="p3-modal-overlay fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1 }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <motion.div
        ref={surfaceRef}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        className="p3-modal-surface p3-signin-modal w-full max-w-md rounded-3xl glass-modal border border-white/70 p-6 sm:p-7 relative"
        role="dialog"
        aria-modal="true"
        aria-label="Member sign in"
        tabIndex={-1}
      >
        <button type="button" onClick={dismiss} className="p3-icon-button p3-modal-close absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-[#F4EFEA] flex items-center justify-center cursor-pointer" aria-label="Close">
          <X className="w-4 h-4 text-[#595550]" />
        </button>

        <div className="pr-8">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#455240]">
            <Sparkles className="w-3.5 h-3.5 text-[#8D5B4C]" />
            Member notifications
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1C1B1A] mt-2">Sign in to your community account</h2>
          <p className="text-sm text-[#595550] mt-1.5">Receive meetup and announcement updates, and keep your notification read state synced across devices.</p>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => setMode('magic')} className={`p3-segmented-button flex-1 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${mode === 'magic' ? 'glass-button' : 'glass-button-secondary'}`}>Email link</button>
          <button type="button" onClick={() => setMode('password')} className={`p3-segmented-button flex-1 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${mode === 'password' ? 'glass-button' : 'glass-button-secondary'}`}>Password</button>
        </div>

        <form onSubmit={submit} className="p3-form mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-[#1C1B1A]">Email</span>
            <div className="mt-1 relative">
              <Mail className="w-4 h-4 text-[#8C857B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="p3-input w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm" placeholder="you@example.com" />
            </div>
          </label>

          {mode === 'password' && (
            <label className="block">
              <span className="text-xs font-semibold text-[#1C1B1A]">Password</span>
              <div className="mt-1 relative">
                <Lock className="w-4 h-4 text-[#8C857B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="p3-input w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-sm" placeholder="Your password" />
              </div>
            </label>
          )}

          {error && <p className="p3-form-error text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="p3-form-success text-xs text-green-800 bg-green-50 border border-green-200 rounded-xl px-3 py-2">{success}</p>}

          <button type="submit" disabled={loading} className="p3-form-submit w-full glass-button px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60">
            {loading ? 'Please wait…' : mode === 'magic' ? 'Send secure sign-in link' : 'Sign in'}
          </button>

          {mode === 'password' && onForgotPassword && (
            <button
              type="button"
              onClick={requestReset}
              disabled={loading || !email.trim()}
              className="p3-text-action w-full text-xs text-[#595550] hover:text-[#1C1B1A] py-1 cursor-pointer disabled:opacity-60"
            >
              Forgot password?
            </button>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
};
