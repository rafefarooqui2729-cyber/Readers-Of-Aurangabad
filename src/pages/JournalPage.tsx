import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { JournalCategory } from '../types';
import { ArrowRight, Clock, Feather, Globe, Search } from 'lucide-react';
import { scrollToTop } from '../utils/scroll';
import { Button, fieldClasses, FilterButton, PageHero, PaperPanel } from '../components/ui';

const CATEGORIES: JournalCategory[] = [
  'Reader Stories',
  'Personal Essays',
  'Book Reflections',
  'Literature & Culture',
  'Poetry',
  'Opinions',
  'Creative Writing',
  'Community Experiences',
];

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'all', label: 'All' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'à¤¹à¤¿à¤¨à¥à¤¦à¥€' },
  { code: 'ur', label: 'Ø§Ø±Ø¯Ùˆ' },
  { code: 'mr', label: 'à¤®à¤°à¤¾à¤ à¥€' },
];

export const JournalPage: React.FC = () => {
  const { articles, setSelectedArticle, setCurrentPage } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === 'All' || article.category === selectedCategory;
    const matchesLanguage =
      selectedLanguage === 'all' || article.language === selectedLanguage;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      article.title.toLowerCase().includes(query) ||
      article.author.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query);
    return matchesCategory && matchesLanguage && matchesSearch;
  });

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedLanguage('all');
    setSearchQuery('');
  };

  return (
    <div className="paper-grain overflow-hidden pb-16">
      <PageHero
        image="/images/enhanced/gallery/roa-019-2026-11-05.webp"
        alt="Books open for reading"
        eyebrow="Writing from the reading community"
        title="The Journal"
        lead="Essays, reader memoirs, cultural reflections, and poetry from Aurangabad, the Deccan, and beyond."
      />

      <div className="space-y-10 sm:space-y-12">
        <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-12" aria-label="Find articles">
          <div className="max-w-xl">
            <label htmlFor="journal-search" className="mb-2 block font-sans text-xs font-bold text-[#24262D] dark:text-[#F7F3EB]">
              Search the journal
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E5B55] dark:text-[#D4CFC5]"
                aria-hidden="true"
              />
              <input
                id="journal-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search articles, authors, or literary topics…"
                className={`${fieldClasses} pl-11`}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-5 px-5 sm:px-8 lg:px-12" aria-label="Filter articles">
          <div
            className="flex items-center gap-2 overflow-x-auto pb-2"
            role="group"
            aria-label="Filter by category"
          >
            <FilterButton active={selectedCategory === 'All'} onClick={() => setSelectedCategory('All')}>
              All categories ({articles.length})
            </FilterButton>
            {CATEGORIES.map((category) => {
              const count = articles.filter((article) => article.category === category).length;
              return (
                <FilterButton
                  key={category}
                  active={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                  className="shrink-0"
                >
                  {category}
                  {count > 0 ? ` (${count})` : ''}
                </FilterButton>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 border-t border-[#24262D]/20 pt-5 dark:border-[#F7F3EB]/20 sm:flex-row sm:items-end sm:justify-between">
            <div role="group" aria-label="Filter by language">
              <p className="mb-2 flex items-center gap-2 font-sans text-xs font-bold text-[#24262D] dark:text-[#F7F3EB]">
                <Globe className="h-4 w-4 text-[#5E5B55] dark:text-[#D4CFC5]" aria-hidden="true" />
                Language
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((language) => (
                  <FilterButton
                    key={language.code}
                    active={selectedLanguage === language.code}
                    onClick={() => setSelectedLanguage(language.code)}
                    className="min-h-[36px] px-3 py-1.5"
                  >
                    {language.label}
                  </FilterButton>
                ))}
              </div>
            </div>
            <p className="font-sans text-xs text-[#5E5B55] dark:text-[#D4CFC5]" aria-live="polite">
              Showing {filteredArticles.length} published {filteredArticles.length === 1 ? 'piece' : 'pieces'}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12" aria-label="Journal articles">
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => {
                const isUrdu = article.language === 'ur';
                const isIndic = article.language === 'hi' || article.language === 'mr';
                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => setSelectedArticle(article)}
                    aria-label={`Read ${article.title}`}
                    className="group flex h-full w-full flex-col border border-[#24262D]/20 bg-[#FFFDF8] text-left transition-colors hover:border-[#F47B49] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47B49] dark:border-[#F7F3EB]/20 dark:bg-[#24262D] dark:hover:border-[#C7EFDE]"
                  >
                    <div className="relative h-52 overflow-hidden bg-[#24262D] sm:h-56">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover object-[center_25%] transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <span className="border border-[#24262D]/20 bg-[#FFFDF8] px-2.5 py-1 text-[11px] font-bold text-[#24262D]">
                          {article.category}
                        </span>
                        <span className="border border-[#F7F3EB]/40 bg-[#24262D] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#F7F3EB]">
                          {article.language}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div dir={isUrdu ? 'rtl' : 'ltr'} lang={article.language}>
                        <h2
                          className={`font-display text-xl font-bold leading-snug text-[#24262D] transition-colors group-hover:text-[#F47B49] dark:text-[#F7F3EB] dark:group-hover:text-[#C7EFDE] sm:text-2xl ${
                            isUrdu
                              ? 'font-urdu text-right leading-[2.1]'
                              : isIndic
                              ? 'font-hindi leading-[1.6]'
                              : 'font-serif'
                          }`}
                        >
                          {article.title}
                        </h2>
                        <p
                          className={`mt-3 line-clamp-3 font-sans text-sm leading-relaxed text-[#5E5B55] dark:text-[#D4CFC5] ${
                            isUrdu
                              ? 'font-urdu text-right text-base leading-[2.1]'
                              : isIndic
                              ? 'font-hindi leading-[1.7]'
                              : ''
                          }`}
                        >
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="mt-auto border-t border-[#24262D]/15 pt-4 dark:border-[#F7F3EB]/15">
                        <div className="flex items-center justify-between gap-3 font-sans text-xs text-[#5E5B55] dark:text-[#D4CFC5]">
                          <span className="font-bold text-[#24262D] dark:text-[#F7F3EB]">{article.author}</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#5E5B55] dark:text-[#D4CFC5]" aria-hidden="true" />
                            {article.readingTime} min
                          </span>
                        </div>
                        <span className="mt-4 flex items-center gap-2 font-sans text-xs font-bold text-[#F47B49] dark:text-[#C7EFDE]">
                          Read full piece
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <PaperPanel className="mx-auto max-w-md rounded-none p-8 text-center sm:p-10">
              <Feather className="mx-auto h-8 w-8 text-[#F47B49] dark:text-[#C7EFDE]" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-bold text-[#24262D] dark:text-[#F7F3EB]">
                No articles found
              </h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#5E5B55] dark:text-[#D4CFC5]">
                Try a different search term, or reset the filters to see every published piece.
              </p>
              <Button type="button" onClick={clearFilters} className="mt-6">
                Clear all filters
              </Button>
            </PaperPanel>
          )}
        </section>

        <section className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-12">
          <PaperPanel className="flex flex-col gap-6 rounded-none border-l-4 border-l-[#FFD8C1] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#F47B49] dark:text-[#C7EFDE]">
                Write for the journal
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[#24262D] dark:text-[#F7F3EB]">
                We publish reader stories and perspectives
              </h2>
              <p className="mt-2 max-w-lg font-sans text-sm leading-relaxed text-[#5E5B55] dark:text-[#D4CFC5]">
                Have you written a poem in Dakhani, a critique of a regional novel, or a personal essay on how
                reading changed you? Send your draft to our editors.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setCurrentPage('contact');
                scrollToTop();
              }}
              className="shrink-0"
            >
              Submit an article
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </PaperPanel>
        </section>
      </div>
    </div>
  );
};
