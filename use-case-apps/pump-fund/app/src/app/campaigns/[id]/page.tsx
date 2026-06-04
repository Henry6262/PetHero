'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Heart, Share2, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import CategoryIcon from '@/components/CategoryIcon';
import { CAMPAIGNS, TOP_DONORS } from '@/lib/mock';

const QUICK = [0.5, 1, 5, 10];

function initials(name: string) {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '');
  return clean.slice(0, 2).toUpperCase();
}

export default function CampaignDetail() {
  const params = useParams();
  const id = String(params.id);
  const campaign = useMemo(() => CAMPAIGNS.find((c) => c.id === id), [id]);
  const [amount, setAmount] = useState('1');

  if (!campaign) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="grid place-items-center px-4 pt-48 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink">Campaign not found</h1>
          <Link href="/campaigns" className="btn-primary mt-6">
            Back to explore
          </Link>
        </div>
      </main>
    );
  }

  const percent = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
  const funded = percent >= 100;

  function donate() {
    const v = parseFloat(amount);
    if (!v || v <= 0) return toast.error('Enter an amount');
    toast.success(`Demo: would donate ${v} SOL to ${campaign!.title}`);
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <Link
          href="/campaigns"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} /> All campaigns
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          {/* ---------- left: story ---------- */}
          <div className="animate-fade-up">
            <div className="mb-4 flex items-center gap-3">
              <span className="pill">{campaign.category}</span>
              {funded && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-bold text-sky">
                  <Sparkles size={12} /> Goal reached
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl">
              {campaign.title}
            </h1>

            <div
              className={`relative mt-7 aspect-[16/9] overflow-hidden rounded-4xl bg-gradient-to-br ${campaign.cover} shadow-soft`}
            >
              <CategoryIcon
                icon={campaign.icon}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90"
                size={96}
                strokeWidth={1.2}
              />
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-3xl border border-line bg-card p-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-wash font-mono text-sm font-bold text-blue-deep">
                {initials(campaign.creator)}
              </span>
              <div className="text-sm">
                <div className="text-ink-soft">Organized by</div>
                <div className="font-semibold text-ink">{campaign.creator}</div>
              </div>
              <span className="ml-auto font-mono text-xs text-ink-faint">${campaign.symbol}</span>
            </div>

            <div className="mt-8">
              <h2 className="font-display text-2xl font-semibold text-ink">The story</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{campaign.blurb}</p>
              <p className="mt-4 leading-relaxed text-ink-soft">
                Every contribution is held in an on-chain escrow until the goal is
                reached. If the campaign falls short by its deadline, every backer
                can reclaim their SOL in full — no questions, no middleman.
              </p>
              <p className="mt-4 leading-relaxed text-ink-soft">
                When <span className="font-semibold text-ink">{campaign.creator}</span>{' '}
                launches the <span className="font-mono">${campaign.symbol}</span> token,
                the top 9 backers below are locked in as permanent creator-fee
                recipients — earning a share of every trade, forever.
              </p>
            </div>

            {/* leaderboard */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-ink">Top backers</h2>
                <span className="text-sm text-ink-soft">{campaign.donors.toLocaleString()} total</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                The <span className="font-semibold text-blue">top 9</span> earn creator-fee
                shares when the token launches.
              </p>

              <ul className="mt-5 space-y-2">
                {TOP_DONORS.map((d, i) => {
                  const earner = i < 9;
                  return (
                    <li
                      key={d.name}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                        earner ? 'border-blue/30 bg-blue-wash/60' : 'border-line bg-card'
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-xs font-bold ${
                          earner ? 'bg-blue text-white' : 'bg-paper-deep text-ink-soft'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-paper-deep font-mono text-[0.62rem] font-bold text-ink-soft">
                        {initials(d.name)}
                      </span>
                      <span className="font-semibold text-ink">{d.name}</span>
                      {earner && (
                        <span className="rounded-full bg-blue/15 px-2 py-0.5 text-[0.7rem] font-bold text-blue-deep">
                          fee earner
                        </span>
                      )}
                      <span className="ml-auto font-mono text-sm font-semibold text-ink">
                        {d.amount} SOL
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* ---------- right: sticky donate ---------- */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="animate-fade-up rounded-4xl border border-line bg-card p-6 shadow-lift [animation-delay:120ms]">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-ink">{campaign.raised}</span>
                <span className="text-ink-soft">SOL raised</span>
              </div>
              <div className="mt-1 text-sm text-ink-soft">
                of {campaign.goal} SOL goal · {percent}%
              </div>

              <div className="mt-4 track !h-3">
                <span style={{ width: `${percent}%` }} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-paper-deep/60 p-3">
                  <div className="font-mono text-lg font-bold text-ink">{campaign.donors.toLocaleString()}</div>
                  <div className="text-xs text-ink-soft">backers</div>
                </div>
                <div className="rounded-2xl bg-paper-deep/60 p-3">
                  <div className="font-mono text-lg font-bold text-ink">
                    {funded ? 'Funded' : `${campaign.daysLeft}d`}
                  </div>
                  <div className="text-xs text-ink-soft">{funded ? 'goal reached' : 'remaining'}</div>
                </div>
              </div>

              <div className="mt-6">
                <label className="label">Back this campaign</label>
                <div className="flex gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => setAmount(String(q))}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-all ${
                        amount === String(q)
                          ? 'border-blue bg-blue-wash text-blue-deep'
                          : 'border-line bg-card text-ink-soft hover:border-blue/40'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="relative mt-3">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input pr-14 font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
                    SOL
                  </span>
                </div>
              </div>

              <button onClick={donate} className="btn-primary mt-4 w-full text-base">
                <Heart size={17} className="fill-white" /> Back it now
              </button>
              <button className="btn-ghost mt-2 w-full text-sm">
                <Share2 size={15} /> Share campaign
              </button>

              <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
                Funds are held in on-chain escrow and fully refundable if the goal
                isn’t met by the deadline.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
