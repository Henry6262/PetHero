'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CampaignCard from '@/components/CampaignCard';
import { CAMPAIGNS } from '@/lib/mock';

const CATEGORIES = ['All', 'Environment', 'Small business', 'Community', 'Medical', 'Creative', 'Outdoors'];
const SORTS = ['Trending', 'Most funded', 'Ending soon', 'Newest'] as const;

export default function CampaignsPage() {
  const [cat, setCat] = useState('All');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Trending');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    let l = CAMPAIGNS.filter((c) => (cat === 'All' ? true : c.category === cat));
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(
        (c) => c.title.toLowerCase().includes(q) || c.creator.toLowerCase().includes(q),
      );
    }
    const sorted = [...l];
    if (sort === 'Most funded') sorted.sort((a, b) => b.raised - a.raised);
    if (sort === 'Ending soon') sorted.sort((a, b) => a.daysLeft - b.daysLeft);
    if (sort === 'Trending') sorted.sort((a, b) => b.donors - a.donors);
    return sorted;
  }, [cat, sort, query]);

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="px-4 pb-8 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <span className="pill">Explore</span>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Back a dream. Earn the upside.
            </h1>

            {/* search */}
            <div className="relative w-full max-w-xs">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
                width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campaigns or creators"
                className="input !rounded-full !py-3 pl-11 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* filters */}
      <section className="sticky top-[4.5rem] z-30 border-y border-line bg-paper/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  cat === c
                    ? 'bg-ink text-paper'
                    : 'border border-line bg-card text-ink-soft hover:border-blue/40 hover:text-ink'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
            className="cursor-pointer rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-ink focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                Sort: {s}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {list.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-line-strong py-24 text-center">
              <p className="text-lg text-ink-soft">No campaigns match that search.</p>
              <Link href="/create" className="btn-primary mt-6">
                Start the first one
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c, i) => (
                <CampaignCard key={c.id} c={c} delay={i * 60} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
