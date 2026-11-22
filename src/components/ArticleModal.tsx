import React, { useRef, useState } from 'react';
import type { JournalArticle } from '../types';
import { X, Clock, Calendar, Share2, Bookmark, Check, BookOpen, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, useReducedMotion } from 'framer-motion';
import { useModalEscapeDismiss } from '../utils/modalAccessibility';

interface ArticleModalProps {
  article: JournalArticle | null;
  onClose: () => void;
  onSelectArticle: (article: JournalArticle) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onSelectArticle
}) => {
  const { articles } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dismiss = useModalEscapeDismiss(Boolean(article), onClose, surfaceRef);

  if (!article) return null;

  const isUrdu = article.language === 'ur';
  const isHindi = article.language === 'hi' || article.language === 'mr';

  const relatedArticles = articles
    .filter(a => a.id !== article.id && (a.category === article.category || a.language === article.language))
    .slice(0, 2);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: `Read "${article.title}" by ${article.author} on Readers of Aurangabad Journal`,
          url: window.location.href,
        });
      } catch {
        // Share dismissed or unsupported at call time — nothing else to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `"${article.title}" by ${article.author}\nReaders of Aurangabad Journal\nRead here: ${window.location.origin}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      className="p3-modal-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-2 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
    >
      <motion.div
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-label={article.title}
        tabIndex={-1}
        className="p3-modal-surface p3-article-modal rr-modal flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16, scale: shouldReduceMotion ? 1 : 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 0.985 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p3-modal-header glass-nav sticky top-0 z-20 flex items-center justify-between border-b border-[color:var(--rr-border)] px-5 py-3 sm:px-7">
          <button
            onClick={dismiss}
            className="p3-text-action rr-link cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Journal</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`p3-icon-button rr-touch flex h-10 w-10 items-center justify-center border transition-colors ${
                bookmarked
                  ? 'border-[color:var(--rr-terracotta)] text-[color:var(--rr-terracotta)]'
                  : 'border-[color:var(--rr-border)] text-[color:var(--rr-muted)] hover:text-[color:var(--rr-forest)]'
              }`}
              title="Bookmark for later"
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p3-secondary-action rr-btn rr-btn--outline cursor-pointer"
              title="Share piece"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--rr-terracotta)]" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={dismiss}
              className="p3-icon-button p3-modal-close rr-touch flex h-10 w-10 items-center justify-center border border-transparent text-[color:var(--rr-muted)] hover:border-[color:var(--rr-border)] hover:text-[color:var(--rr-ink)] transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className="p3-modal-body p3-reading-body overflow-y-auto p-6 sm:p-10"
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          <div className="mb-8 space-y-4 border-b border-[color:var(--rr-border)] pb-8">
            <div className="flex flex-wrap items-center gap-4">
              <span className="rr-meta border border-[color:var(--rr-border)] bg-[color:var(--rr-sage)] px-3 py-1.5 text-[color:var(--rr-forest)]">
                {article.category}
              </span>
              <span className="rr-meta text-[color:var(--rr-muted)]">
                Language: {article.language.toUpperCase()}
              </span>
            </div>

            <h2 className={`rr-title ${isUrdu ? 'font-urdu text-right leading-[2.1]' : isHindi ? 'font-hindi leading-[1.45]' : ''}`}>
              {article.title}
            </h2>

            <p className={`max-w-2xl border-l border-[color:var(--rr-brass)] pl-5 font-display text-lg italic leading-relaxed text-[color:var(--rr-muted)] ${isUrdu ? 'font-urdu text-right leading-[2.1]' : isHindi ? 'font-hindi leading-[1.7]' : ''}`}>
              "{article.excerpt}"
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--rr-border)] pt-5 text-[color:var(--rr-muted)]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-[color:var(--rr-forest)] font-display font-semibold text-sm text-[color:var(--rr-on-dark)]">
                  {article.author.charAt(0)}
                </span>
                <div>
                  <span className="block text-sm font-semibold text-[color:var(--rr-ink)]">{article.author}</span>
                  {article.authorRole && (
                    <span className="rr-meta mt-0.5 block text-[color:var(--rr-terracotta)]">{article.authorRole}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="rr-meta">{article.publishedDate}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="rr-meta">{article.readingTime} min read</span>
                </span>
              </div>
            </div>
          </div>

          {article.coverImage && (
            <div className="rr-image mb-8 overflow-hidden border border-[color:var(--rr-border)]">
              <img
                src={article.coverImage}
                alt={article.title}
                loading="lazy"
                className="h-56 w-full object-cover object-[center_20%] sm:h-72 md:h-96"
              />
            </div>
          )}

          <div className={`roa-prose max-w-none space-y-6 text-[color:var(--rr-ink)] ${isUrdu ? 'text-right font-urdu text-xl leading-[2.2]' : isHindi ? 'font-hindi text-base leading-[1.85]' : ''}`}>
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className={isUrdu ? 'text-right' : 'text-justify sm:text-left'}>
                {paragraph}
              </p>
            ))}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-[color:var(--rr-border)] pt-6">
              {article.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rr-meta border border-[color:var(--rr-border)] px-2.5 py-1.5 text-[color:var(--rr-muted)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {relatedArticles.length > 0 && (
            <div className="mt-12 border-t border-[color:var(--rr-border)] pt-8">
              <h3 className="rr-title rr-title--small mb-5 text-[color:var(--rr-ink)]">
                More Reflections from the Journal
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {relatedArticles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectArticle(rel)}
                    className="cursor-pointer border border-[color:var(--rr-border)] p-4 transition-colors hover:border-[color:var(--rr-brass)]"
                  >
                    <span className="rr-meta mb-2 block text-[color:var(--rr-terracotta)]">
                      {rel.category}
                    </span>
                    <h4 className="font-display text-lg font-semibold leading-tight text-[color:var(--rr-ink)] line-clamp-2">
                      {rel.title}
                    </h4>
                    <p className="rr-meta mt-2 text-[color:var(--rr-muted)]">
                      By {rel.author} · {rel.readingTime} min read
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p3-modal-actions flex items-center justify-between gap-4 border-t border-[color:var(--rr-border)] bg-[color:var(--rr-paper)] px-5 py-3 sm:px-7">
          <span className="rr-meta flex items-center gap-2 text-[color:var(--rr-muted)]">
            <BookOpen className="h-4 w-4 text-[color:var(--rr-forest)]" aria-hidden="true" />
            Readers of Aurangabad Journal
          </span>
          <button
            onClick={dismiss}
            className="p3-text-action rr-link cursor-pointer"
          >
            Close Reader
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
};
