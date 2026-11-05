import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { JournalCategory } from '../types';
import { 
  Search, 
  Clock, 
  ArrowRight, 
  Globe, 
  Feather
} from 'lucide-react';

const CATEGORIES: JournalCategory[] = [
  'Reader Stories',
  'Personal Essays',
  'Book Reflections',
  'Literature & Culture',
  'Poetry',
  'Opinions',
  'Creative Writing',
  'Community Experiences'
];

export const JournalPage: React.FC = () => {
  const { articles, setSelectedArticle, setCurrentPage } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = articles.filter((art) => {
    const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'all' || art.language === selectedLanguage;
    const matchesSearch = searchQuery.trim() === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesLanguage && matchesSearch;
  });

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 paper-grain">
      
      {/* 1. HERO HEADER */}
      <section className="pt-6 sm:pt-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF0E9] border border-[#455240]/20 text-[#2E372B] text-xs font-semibold">
          <Feather className="w-3.5 h-3.5 text-[#455240]" />
          <span>Independent Literary Magazine</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1C1B1A] leading-[1.15]">
          The Journal
        </h1>

        <p className="text-lg sm:text-xl text-[#595550] font-serif italic max-w-2xl mx-auto leading-relaxed">
          "Essays, reader memoirs, cultural reflections, and poetry from Aurangabad, the Deccan, and beyond."
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-[#8C857B] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles, authors, or literary topics..."
            className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#E8E2D5] focus:border-[#455240] focus:ring-1 focus:ring-[#455240] outline-none text-sm text-[#1C1B1A] placeholder-[#8C857B] transition-all shadow-sm"
          />
        </div>
      </section>

      {/* 2. CATEGORY & LANGUAGE FILTER BARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#1C1B1A] text-white shadow-sm'
                : 'bg-white text-[#595550] border border-[#E8E2D5] hover:border-[#1C1B1A]'
            }`}
          >
            All Categories ({articles.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = articles.filter(a => a.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#1C1B1A] text-white shadow-sm'
                    : 'bg-white text-[#595550] border border-[#E8E2D5] hover:border-[#1C1B1A]'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Language Filter Tags */}
        <div className="flex items-center justify-between text-xs text-[#8C857B] pt-2 border-t border-[#E8E2D5]">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#455240]" />
            <span className="font-semibold text-[#1C1B1A]">Language:</span>
            <button
              onClick={() => setSelectedLanguage('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedLanguage === 'all' ? 'bg-[#1C1B1A] text-white font-semibold' : 'hover:text-[#1C1B1A]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedLanguage === 'en' ? 'bg-[#1C1B1A] text-white font-semibold' : 'hover:text-[#1C1B1A]'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('hi')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedLanguage === 'hi' ? 'bg-[#1C1B1A] text-white font-semibold' : 'hover:text-[#1C1B1A]'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setSelectedLanguage('ur')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedLanguage === 'ur' ? 'bg-[#1C1B1A] text-white font-semibold' : 'hover:text-[#1C1B1A]'
              }`}
            >
              اردو
            </button>
            <button
              onClick={() => setSelectedLanguage('mr')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedLanguage === 'mr' ? 'bg-[#1C1B1A] text-white font-semibold' : 'hover:text-[#1C1B1A]'
              }`}
            >
              मराठी
            </button>
          </div>

          <span>Showing {filteredArticles.length} published pieces</span>
        </div>

      </section>

      {/* 3. ARTICLES MAGAZINE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => {
              const isUrdu = article.language === 'ur';
              return (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="paper-card rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-52 sm:h-56 overflow-hidden bg-[#1C1B1A]">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#1C1B1A] border border-[#E8E2D5] shadow-sm">
                          {article.category}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-black/60 text-white backdrop-blur-sm">
                          {article.language}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-3" dir={isUrdu ? 'rtl' : 'ltr'}>
                      <h3 className={`font-serif font-bold text-xl sm:text-2xl text-[#1C1B1A] group-hover:text-[#455240] transition-colors leading-snug ${
                        isUrdu ? 'font-urdu leading-[1.8]' : ''
                      }`}>
                        {article.title}
                      </h3>

                      <p className="text-sm text-[#595550] line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-3">
                    <div className="pt-3 border-t border-[#F4EFEA] flex items-center justify-between text-xs text-[#8C857B]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1C1B1A]">{article.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{article.readingTime} min</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="w-full text-center py-2 text-xs font-semibold text-[#1C1B1A] group-hover:text-[#455240] group-hover:bg-[#F4EFEA] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Read Full Piece</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-[#E8E2D5] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">No articles found</h3>
            <p className="text-sm text-[#595550]">
              Try resetting your category or language filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedLanguage('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-[#455240] underline pt-2"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* 4. CALL FOR WRITERS BANNER */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="paper-card p-8 sm:p-10 rounded-2xl bg-[#F4EFEA] border border-[#E8E2D5] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="font-serif text-2xl font-bold text-[#1C1B1A]">
              We Publish Reader Stories & Perspectives
            </h3>
            <p className="text-sm text-[#595550] max-w-lg leading-relaxed">
              Have you written a poem in Dakhani, a critique of a regional novel, or a personal essay on how reading changed you? Send your draft to our editors.
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentPage('contact');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="shrink-0 bg-[#1C1B1A] hover:bg-[#455240] text-white px-6 py-3 rounded-full text-xs font-semibold transition-all shadow-sm"
          >
            Submit an Article
          </button>
        </div>
      </section>

    </div>
  );
};
