'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';

const STEPS = ['Your cause', 'Token & goal', 'Reward split'] as const;

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'Community',
    blurb: '',
    symbol: '',
    goal: '',
    durationDays: '30',
    creatorShare: 40,
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  function next() {
    if (step === 0 && (!form.title || !form.blurb)) return toast.error('Add a title and story');
    if (step === 1 && (!form.symbol || !form.goal)) return toast.error('Add a token symbol and goal');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function submit() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Demo: campaign created!');
      router.push('/campaigns');
    }, 900);
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <span className="pill">Start a campaign</span>
        <h1 className="mt-5 font-display text-4xl font-bold text-ink sm:text-5xl">
          Tell the world what to fund
        </h1>
        <p className="mt-3 text-ink-soft">
          Three short steps. You can edit everything before it goes live.
        </p>

        {/* stepper */}
        <div className="mt-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-sm font-bold transition-colors ${
                  i <= step ? 'bg-blue text-white' : 'bg-paper-deep text-ink-faint'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${i === step ? 'text-ink' : 'text-ink-faint'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="ml-auto h-px flex-1 bg-line" />}
            </div>
          ))}
        </div>

        <div className="mt-8 card !p-7">
          {/* ---- step 0 ---- */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-up">
              <div>
                <label className="label">Campaign title</label>
                <input
                  className="input"
                  maxLength={80}
                  placeholder="e.g. Rebuild the community greenhouse"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input cursor-pointer"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  {['Community', 'Environment', 'Small business', 'Medical', 'Creative', 'Outdoors'].map(
                    (c) => (
                      <option key={c}>{c}</option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="label">Your story</label>
                <textarea
                  className="input resize-none"
                  rows={5}
                  maxLength={600}
                  placeholder="What are you raising for, and why does it matter?"
                  value={form.blurb}
                  onChange={(e) => set('blurb', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ---- step 1 ---- */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-up">
              <div>
                <label className="label">Token symbol</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-ink-faint">$</span>
                  <input
                    className="input pl-8 font-mono uppercase"
                    maxLength={10}
                    placeholder="DREAM"
                    value={form.symbol}
                    onChange={(e) => set('symbol', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Funding goal</label>
                  <div className="relative">
                    <input
                      className="input pr-14 font-mono"
                      type="number"
                      min="1"
                      placeholder="100"
                      value={form.goal}
                      onChange={(e) => set('goal', e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
                      SOL
                    </span>
                  </div>
                </div>
                <div>
                  <label className="label">Duration</label>
                  <div className="relative">
                    <input
                      className="input pr-16 font-mono"
                      type="number"
                      min="1"
                      max="90"
                      value={form.durationDays}
                      onChange={(e) => set('durationDays', e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
                      days
                    </span>
                  </div>
                </div>
              </div>
              <p className="rounded-2xl bg-blue-wash/60 p-4 text-sm text-blue-deep">
                Funds sit in on-chain escrow. If you don’t hit your goal by the
                deadline, every backer is automatically refunded.
              </p>
            </div>
          )}

          {/* ---- step 2 ---- */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-up">
              <p className="text-sm text-ink-soft">
                Decide how much of the <span className="font-mono">${form.symbol || 'TOKEN'}</span>{' '}
                creator fees you keep. The rest is split among your top 9 backers
                and <span className="font-semibold text-ink">locks permanently</span> at launch.
              </p>
              <div>
                <div className="flex items-center justify-between">
                  <label className="label !mb-0">Your share</label>
                  <span className="font-mono text-lg font-bold text-blue">{form.creatorShare}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={form.creatorShare}
                  onChange={(e) => set('creatorShare', Number(e.target.value))}
                  className="mt-3 w-full accent-blue"
                />
                <div className="mt-1 flex justify-between text-xs text-ink-faint">
                  <span>10% (most generous)</span>
                  <span>90%</span>
                </div>
              </div>
              <div className="flex h-4 w-full overflow-hidden rounded-full">
                <span className="bg-sky" style={{ width: `${form.creatorShare}%` }} />
                <span className="bg-blue" style={{ width: `${100 - form.creatorShare}%` }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-soft">
                  <span className="h-3 w-3 rounded-full bg-sky" /> You
                </span>
                <span className="flex items-center gap-2 text-ink-soft">
                  <span className="h-3 w-3 rounded-full bg-blue" /> Top 9 backers ({100 - form.creatorShare}%)
                </span>
              </div>
            </div>
          )}

          {/* nav */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-0"
            >
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn-primary">
                Continue
              </button>
            ) : (
              <button onClick={submit} disabled={loading} className="btn-primary">
                {loading ? 'Creating…' : 'Launch campaign'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
