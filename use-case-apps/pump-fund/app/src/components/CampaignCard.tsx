import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { MockCampaign } from '@/lib/mock';
import CategoryIcon from '@/components/CategoryIcon';
import SpotlightCard from '@/components/reactbits/SpotlightCard';

function pct(raised: number, goal: number) {
  return Math.min(100, Math.round((raised / goal) * 100));
}

export default function CampaignCard({ c, delay = 0 }: { c: MockCampaign; delay?: number }) {
  const percent = pct(c.raised, c.goal);
  const funded = percent >= 100;

  return (
    <Link
      href={`/campaigns/${c.id}`}
      style={{ animationDelay: `${delay}ms` }}
      className="group block animate-fade-up"
    >
      <SpotlightCard
        className="!rounded-4xl !border-line !bg-card !p-0 overflow-hidden shadow-soft transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lift"
        spotlightColor="rgba(29, 78, 216, 0.12)"
      >
        {/* cover */}
        <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${c.cover}`}>
          <CategoryIcon
            icon={c.icon}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90 transition-transform duration-500 group-hover:scale-110"
            size={56}
            strokeWidth={1.4}
          />
          <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">
            {c.category}
          </span>
          <span
            className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold backdrop-blur ${
              funded ? 'bg-ink text-sky' : 'bg-paper/90 text-ink'
            }`}
          >
            {funded ? 'Funded' : `${c.daysLeft}d left`}
          </span>
        </div>

        {/* body */}
        <div className="flex flex-col p-5">
          <h3 className="flex items-start justify-between gap-2 font-display text-lg font-semibold leading-snug text-ink">
            <span className="transition-colors group-hover:text-blue">{c.title}</span>
            <ArrowUpRight
              size={18}
              className="mt-1 shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue"
            />
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{c.blurb}</p>

          <div className="mt-5">
            <div className="track">
              <span style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="font-mono text-sm font-semibold text-ink">
                {c.raised.toLocaleString()} SOL
              </span>
              <span className="text-xs text-ink-faint">
                {percent}% of {c.goal.toLocaleString()}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-soft">
              <span>
                by <span className="font-semibold text-ink">{c.creator}</span>
              </span>
              <span>{c.donors.toLocaleString()} backers</span>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </Link>
  );
}
