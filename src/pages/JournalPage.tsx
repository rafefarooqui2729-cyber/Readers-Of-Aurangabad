import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { JournalCategory } from '../types';
import { ArrowRight, Clock, Feather, Globe, Search } from 'lucide-react';
import { scrollToTop } from '../utils/scroll';
import { Button, fieldClasses, FilterButton, PageHero } from '../components/ui';

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

  const [leadArticle, ...otherArticles] = filteredArticles;

  return (
    <div className="rr-home">
      <PageHero
        image="/images/enhanced/gallery/roa-019-2026-11-05.webp"
        alt="Books open for reading"
        eyebrow="Writing from the reading community"
        title="The Journal"
        lead="Essays, reader memoirs, cultural reflections, and poetry from Aurangabad, the Deccan, and beyond."
      />

      {/* Search — a single ruled field, set apart from the index. */}
      <section className="rr-section rr-section--tight" aria-label="Find articles">
        <div className="rr-container max-w-2xl">
          <p className="rr-eyebrow">Find a piece</p>
          <label htmlFor="journal-search" className="rr-label mt-6 block">
            Search the journal
          </label>
          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--rr-muted)]"
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

      {/* Filters — two registers of the magazine index. */}
      <section className="rr-section rr-section--line" aria-label="Filter articles">
        <div className="rr-container">
          <div
            className="rr-filter-row"
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

          <div className="flex flex-col gap-6 border-t border-[color:var(--rr-border)] pt-6 md:flex-row md:items-end md:justify-between">
            <div role="group" aria-label="Filter by language">
              <p className="rr-meta flex items-center gap-2 text-[color:var(--rr-terracotta)]">
                <Globe className="h-4 w-4" aria-hidden="true" />
                Language
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {LANGUAGES.map((language) => (
                  <FilterButton
                    key={language.code}
                    active={selectedLanguage === language.code}
                    onClick={() => setSelectedLanguage(language.code)}
                    className="min-h-[44px] px-3 py-1.5"
                  >
                    {language.label}
                  </FilterButton>
                ))}
              </div>
            </div>
            <p className="rr-meta text-[color:var(--rr-muted)]" aria-live="polite">
              Showing {filteredArticles.length} published {filteredArticles.length === 1 ? 'piece' : 'pieces'}
            </p>
          </div>
        </div>
      </section>

      {/* Index — one lead feature, then a typed list of remaining pieces. */}
      <section className="rr-section rr-section--line" aria-label="Journal articles">
        <div className="rr-container">
          {filteredArticles.length > 0 ? (
            <div className="rr-journal-grid">
              {leadArticle ? (
                <article
                  className="rr-journal-feature"
                  onClick={() => setSelectedArticle(leadArticle)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedArticle(leadArticle);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Read ${leadArticle.title}`}
                >
                  <div className="rr-journal-feature__image rr-image">
                    <img src={leadArticle.coverImage} alt={leadArticle.title} loading="lazy" />
                    <span className="rr-image-label">Lead piece · {leadArticle.category}</span>
                  </div>
                  <div className="rr-journal-feature__copy">
                    <p className="rr-meta text-[color:var(--rr-terracotta)]">
                      {leadArticle.category} · {leadArticle.language.toUpperCase()}
                    </p>
                    <div dir={leadArticle.language === 'ur' ? 'rtl' : 'ltr'} lang={leadArticle.language}>
                      <h2
                        className={`rr-title rr-title--small mt-4 ${
                          leadArticle.language === 'ur'
                            ? 'font-urdu text-right leading-[2.1]'
                            : leadArticle.language === 'hi' || leadArticle.language === 'mr'
                            ? 'font-hindi leading-[1.6]'
                            : ''
                        }`}
                      >
                        {leadArticle.title}
                      </h2>
                      <p
                        className={`rr-body mt-4 ${
                          leadArticle.language === 'ur'
                            ? 'font-urdu text-right text-base leading-[2.1]'
                            : leadArticle.language === 'hi' || leadArticle.language === 'mr'
                            ? 'font-hindi leading-[1.7]'
                            : ''
                        }`}
                      >
                        {leadArticle.excerpt}
                      </p>
                    </div>
                    <div className="rr-journal-feature__foot">
                      <span>{leadArticle.author}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {leadArticle.readingTime} min
                      </span>
                    </div>
                  </div>
                </article>
              ) : null}

              <div className="rr-journal-list">
                {otherArticles.map((article) => {
                  const isUrdu = article.language === 'ur';
                  const isIndic = article.language === 'hi' || article.language === 'mr';
                  return (
                    <article
                      key={article.id}
                      className="rr-journal-item"
                      onClick={() => setSelectedArticle(article)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedArticle(article);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Read ${article.title}`}
                    >
                      <div className="rr-journal-item__thumb rr-image">
                        <img src={article.coverImage} alt="" loading="lazy" />
                      </div>
                      <div dir={isUrdu ? 'rtl' : 'ltr'} lang={article.language}>
                        <p className="rr-meta text-[color:var(--rr-terracotta)]">
                          {article.category} · {article.language.toUpperCase()}
                        </p>
                        <h3
                          className={`mt-2 font-display text-lg leading-tight ${
                            isUrdu
                              ? 'font-urdu text-right leading-[2.1]'
                              : isIndic
                              ? 'font-hindi leading-[1.6]'
                              : ''
                          }`}
                        >
                          {article.title}
                        </h3>
                        <p
                          className={`rr-body mt-1 text-xs ${
                            isUrdu
                              ? 'font-urdu text-right leading-[2.1]'
                              : isIndic
                              ? 'font-hindi leading-[1.7]'
                              : ''
                          }`}
                        >
                          {article.excerpt}
                        </p>
                        <p className="rr-meta mt-2 text-[color:var(--rr-muted)]">
                          {article.author} · {article.readingTime} min read
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rr-empty">
              <Feather className="h-8 w-8 text-[color:var(--rr-terracotta)]" aria-hidden="true" />
              <h2 className="rr-title rr-title--small mt-4">No articles found</h2>
              <p className="rr-lede mt-3">
                Try a different search term, or reset the filters to see every published piece.
              </p>
              <Button type="button" onClick={clearFilters} className="mt-6">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Submissions */}
      <section className="rr-section rr-section--tight" aria-label="Write for the journal">
        <div className="rr-container">
          <div className="rr-panel rr-panel--sage flex flex-col gap-8 p-8 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="rr-eyebrow">Write for the journal</p>
              <h2 className="rr-title rr-title--compact mt-4">
                We publish reader stories and perspectives
              </h2>
              <p className="rr-body mt-4">
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
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
