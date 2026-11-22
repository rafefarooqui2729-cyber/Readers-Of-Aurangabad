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
      className="p3-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-[#24262D]/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-6"
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
        className="p3-modal-surface p3-article-modal glass-modal rounded-none max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-[var(--mh20-shadow-lg)] relative border-white/75"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16, scale: shouldReduceMotion ? 1 : 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 0.985 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="p3-modal-header px-6 py-4 border-b border-white/40 glass-nav flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={dismiss}
            className="p3-text-action flex items-center gap-1.5 text-xs font-semibold text-[#5E5B55] hover:text-[#24262D] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Journal</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`p3-icon-button p-2 rounded-none border transition-colors ${
                bookmarked
                  ? 'bg-[#F7F3EB] text-[#24262D] border-[#24262D]/30'
                  : 'text-[#5E5B55] border-[#24262D] hover:bg-white'
              }`}
              title="Bookmark for later"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p3-secondary-action flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-[#24262D] text-xs font-medium text-[#5E5B55] hover:bg-white transition-colors"
              title="Share piece"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#F47B49]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={dismiss}
              className="p3-icon-button p3-modal-close p-2 rounded-none text-[#5E5B55] hover:text-[#24262D] hover:bg-white border border-transparent hover:border-[#24262D] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Article Scroll Body */}
        <div
          className="p3-modal-body p3-reading-body p-6 sm:p-10 overflow-y-auto"
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          {/* Article Header Meta */}
          <div className="space-y-4 mb-8 pb-8 border-b border-[#24262D]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-none text-xs font-semibold uppercase tracking-wider bg-[#FFFDF8] text-[#F47B49] border border-[#24262D]">
                {article.category}
              </span>
              <span className="text-xs text-[#5E5B55] uppercase tracking-wider">
                Language: {article.language.toUpperCase()}
              </span>
            </div>

            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-[#24262D] leading-[1.2] ${
              isUrdu
                ? 'font-urdu leading-[2.1] text-right'
                : isHindi
                ? 'font-hindi leading-[1.45]'
                : 'font-serif'
            }`}>
              {article.title}
            </h2>

            <p className={`text-base sm:text-lg text-[#5E5B55] leading-relaxed ${
              isUrdu
                ? 'font-urdu text-right text-lg leading-[2.1]'
                : isHindi
                ? 'font-hindi leading-[1.7]'
                : 'italic font-serif'
            }`}>
              "{article.excerpt}"
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-[#5E5B55]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-[#24262D] flex items-center justify-center text-[#F7F3EB] font-serif font-bold text-sm">
                  {article.author.charAt(0)}
                </div>
                <div>
                  <span className="block font-medium text-sm text-[#24262D]">{article.author}</span>
                  {article.authorRole && (
                    <span className="block text-[11px] text-[#F47B49]">{article.authorRole}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{article.publishedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{article.readingTime} min read</span>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {article.coverImage && (
            <div className="mb-8 rounded-none overflow-hidden border border-[#24262D] shadow-[var(--mh20-shadow-sm)]">
              <img
                src={article.coverImage}
                alt={article.title}
                loading="lazy"
                className="w-full h-56 sm:h-72 md:h-96 object-cover object-[center_20%]"
              />
            </div>
          )}

          {/* Article Full Body Typography */}
          <div className={`prose max-w-none text-[#24262D] text-base sm:text-lg leading-[1.85] space-y-6 ${
            isUrdu
              ? 'text-right font-urdu text-xl leading-[2.2]'
              : isHindi
              ? 'font-hindi text-base sm:text-lg leading-[1.85]'
              : 'font-serif'
          }`}>
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className={isUrdu ? 'text-right' : 'text-justify sm:text-left'}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-[#24262D] flex flex-wrap gap-2">
              {article.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-[#5E5B55] border border-[#24262D]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Related Articles in Journal */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#24262D]">
              <h3 className="font-serif text-xl font-bold text-[#24262D] mb-4">
                More Reflections from the Journal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedArticles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectArticle(rel)}
                    className="p-4 rounded-none bg-white border border-[#24262D] hover:border-[#F47B49] transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-semibold text-[#F47B49] uppercase tracking-wider block mb-1">
                      {rel.category}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#24262D] group-hover:text-[#24262D] transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-[#5E5B55] mt-2">
                      By {rel.author} · {rel.readingTime} min read
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sticky Reading Bar */}
        <div className="p3-modal-actions p-3 bg-white border-t border-[#24262D] text-center text-xs text-[#5E5B55] flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#24262D]" />
            <span>Readers of Aurangabad Journal</span>
          </div>
          <button
            onClick={dismiss}
            className="p3-text-action text-[#24262D] font-semibold hover:underline"
          >
            Close Reader
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
};
