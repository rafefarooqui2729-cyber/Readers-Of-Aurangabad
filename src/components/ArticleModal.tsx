import React, { useState } from 'react';
import type { JournalArticle } from '../types';
import { X, Clock, Calendar, Share2, Bookmark, Check, BookOpen, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

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
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  if (!article) return null;

  const isUrdu = article.language === 'ur';

  const relatedArticles = articles
    .filter(a => a.id !== article.id && (a.category === article.category || a.language === article.language))
    .slice(0, 2);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: `Read "${article.title}" by ${article.author} on Readers of Aurangabad Journal`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `"${article.title}" by ${article.author}\nReaders of Aurangabad Journal\nRead here: ${window.location.origin}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="px-6 py-4 border-b border-[#E8E2D5] bg-[#FAF8F5]/90 backdrop-blur-sm flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#595550] hover:text-[#1C1B1A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Journal</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-2 rounded-lg border transition-colors ${
                bookmarked 
                  ? 'bg-[#EBF0E9] text-[#455240] border-[#455240]/30' 
                  : 'text-[#595550] border-[#E8E2D5] hover:bg-white'
              }`}
              title="Bookmark for later"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E2D5] text-xs font-medium text-[#595550] hover:bg-white transition-colors"
              title="Share piece"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#595550] hover:text-[#1C1B1A] hover:bg-white border border-transparent hover:border-[#E8E2D5] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Article Scroll Body */}
        <div 
          className="p-6 sm:p-10 overflow-y-auto"
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          {/* Article Header Meta */}
          <div className="space-y-4 mb-8 pb-8 border-b border-[#E8E2D5]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#F4EFEA] text-[#8D5B4C] border border-[#E8E2D5]">
                {article.category}
              </span>
              <span className="text-xs text-[#8C857B] uppercase tracking-wider">
                Language: {article.language.toUpperCase()}
              </span>
            </div>

            <h1 className={`font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1B1A] leading-[1.2] ${
              isUrdu ? 'font-urdu leading-[1.8] text-right' : ''
            }`}>
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-[#595550] italic font-serif leading-relaxed">
              "{article.excerpt}"
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-[#8C857B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E8E2D5] flex items-center justify-center text-[#1C1B1A] font-serif font-bold text-sm">
                  {article.author.charAt(0)}
                </div>
                <div>
                  <span className="block font-medium text-sm text-[#1C1B1A]">{article.author}</span>
                  {article.authorRole && (
                    <span className="block text-[11px] text-[#8D5B4C]">{article.authorRole}</span>
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
            <div className="mb-8 rounded-xl overflow-hidden border border-[#E8E2D5] shadow-sm">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-72 sm:h-96 object-cover"
              />
            </div>
          )}

          {/* Article Full Body Typography */}
          <div className={`prose max-w-none text-[#2A2826] text-base sm:text-lg leading-[1.85] space-y-6 ${
            isUrdu ? 'text-right font-urdu text-xl leading-[2.2]' : 'font-serif'
          }`}>
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-justify sm:text-left">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-[#E8E2D5] flex flex-wrap gap-2">
              {article.tags.map((tag, i) => (
                <span 
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-[#595550] border border-[#E8E2D5]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Related Articles in Journal */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#E8E2D5]">
              <h3 className="font-serif text-xl font-bold text-[#1C1B1A] mb-4">
                More Reflections from the Journal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedArticles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectArticle(rel)}
                    className="p-4 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#8D5B4C] transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-semibold text-[#8D5B4C] uppercase tracking-wider block mb-1">
                      {rel.category}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#1C1B1A] group-hover:text-[#455240] transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-[#8C857B] mt-2">
                      By {rel.author} • {rel.readingTime} min read
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sticky Reading Bar */}
        <div className="p-3 bg-white border-t border-[#E8E2D5] text-center text-xs text-[#8C857B] flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#455240]" />
            <span>Readers of Aurangabad Journal</span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#1C1B1A] font-semibold hover:underline"
          >
            Close Reader
          </button>
        </div>

      </div>
    </div>
  );
};
