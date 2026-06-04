import Link from 'next/link';
import { Target, Users, Rocket, Check, Heart, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import CampaignCard from '@/components/CampaignCard';
import CategoryIcon from '@/components/CategoryIcon';
import SoftAurora from '@/components/reactbits/SoftAurora';
import SplitText from '@/components/reactbits/SplitText';
import CountUp from '@/components/reactbits/CountUp';
import AnimatedContent from '@/components/reactbits/AnimatedContent';
import ScrollReveal from '@/components/reactbits/ScrollReveal';
import ShinyText from '@/components/reactbits/ShinyText';
import Magnet from '@/components/reactbits/Magnet';
import CardSwap, { Card } from '@/components/reactbits/CardSwap';
import { CAMPAIGNS, RECENT_DONATIONS } from '@/lib/mock';

const FEE_CARDS = [
  { label: 'You · the creator', share: '40%', tint: 'from-[#1d4ed8] to-[#0a1f4d]' },
  { label: '#1 backer', share: '24%', tint: 'from-[#2563eb] to-[#10204a]' },
  { label: '#2 backer', share: '16%', tint: 'from-[#3b82f6] to-[#13284f]' },
  { label: '#3 backer', share: '12%', tint: 'from-[#60a5fa] to-[#1a2f57]' },
  { label: '#4–9 backers', share: '8%', tint: 'from-[#93c5fd] to-[#1f3560]' },
];

function HeroCard() {
  const c = CAMPAIGNS[0];
  const percent = Math.round((c.raised / c.goal) * 100);
  return (
    <div className="relative animate-float [animation-delay:300ms]">
      <div className="absolute -right-4 -top-5 z-20 animate-float-tag rounded-2xl bg-ink px-4 py-2.5 text-paper shadow-lift sm:-right-8">
        <div className="text-[0.62rem] uppercase tracking-[0.14em] text-sky">Top backers earn</div>
        <div className="font-mono text-sm font-bold">60% of creator fees</div>
      </div>
      <div className="w-[20rem] rotate-[-1.5deg] overflow-hidden rounded-[2rem] border border-line bg-card shadow-lift sm:w-[23rem]">
        <div className={`relative aspect-[16/11] bg-gradient-to-br ${c.cover}`}>
          <CategoryIcon icon={c.icon} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90" size={60} strokeWidth={1.4} />
          <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1 text-xs font-semibold text-ink">{c.category}</span>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-semibold leading-snug text-ink">{c.title}</h3>
          <div className="mt-4 track"><span style={{ width: `${percent}%` }} /></div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="font-mono text-base font-bold text-blue">{c.raised} SOL</span>
            <span className="text-xs text-ink-faint">of {c.goal} goal</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2.5">
              {['MO', 'DS', 'AK', 'JL', 'RM'].map((m, i) => (
                <span key={i} className="grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-blue-wash font-mono text-[0.6rem] font-bold text-blue-deep">{m}</span>
              ))}
            </div>
            <span className="text-xs text-ink-soft"><span className="font-semibold text-ink">{c.donors.toLocaleString()}</span> backers</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden">
      <Navbar />

      {/* ===================== HERO ===================== */}
      <section className="relative px-4 pb-20 pt-28 sm:px-6 sm:pt-36 lg:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem] opacity-70"
          style={{
            maskImage: 'radial-gradient(120% 80% at 50% 0%, black 35%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(120% 80% at 50% 0%, black 35%, transparent 75%)',
          }}
        >
          <SoftAurora color1="#dfe9ff" color2="#2563eb" brightness={0.7} speed={0.6} />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex animate-fade-up">
              <span className="pill">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-blue" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue" />
                </span>
                Crowdfunding, with upside for backers
              </span>
            </div>

            <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              <SplitText text="Fund the dream." tag="span" className="block" textAlign="inherit" splitType="chars" delay={28} duration={0.9} from={{ opacity: 0, y: 44 }} to={{ opacity: 1, y: 0 }} />
              <SplitText text="Share the upside." tag="span" className="block text-blue" textAlign="inherit" splitType="chars" delay={28} duration={0.9} from={{ opacity: 0, y: 44 }} to={{ opacity: 1, y: 0 }} />
            </h1>

            <p className="mx-auto mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-ink-soft [animation-delay:160ms] lg:mx-0">
              Raise SOL for any cause, the way you would on GoFundMe. Then launch
              its token in one click — and your top backers earn a slice of the
              creator fees, forever, paid out on-chain.
            </p>

            <div className="mt-9 flex animate-fade-up flex-col items-center gap-3 [animation-delay:240ms] sm:flex-row lg:justify-start">
              <Magnet padding={70} magnetStrength={4}>
                <Link href="/create" className="btn-primary px-8 text-base">Start a campaign</Link>
              </Magnet>
              <Link href="/campaigns" className="btn-ghost px-8 text-base">
                Explore campaigns <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-12 grid animate-fade-up grid-cols-3 gap-6 border-t border-line pt-8 [animation-delay:320ms]">
              <div>
                <div className="font-mono text-2xl font-bold text-ink sm:text-3xl"><CountUp to={12480} separator="," duration={2} /></div>
                <div className="mt-0.5 text-sm text-ink-soft">SOL raised</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-ink sm:text-3xl"><CountUp to={3200} separator="," duration={2} />+</div>
                <div className="mt-0.5 text-sm text-ink-soft">Backers rewarded</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-ink sm:text-3xl"><CountUp to={100} duration={2} />%</div>
                <div className="mt-0.5 text-sm text-ink-soft">On-chain</div>
              </div>
            </div>
          </div>

          <div className="flex animate-fade-in justify-center [animation-delay:200ms] lg:justify-end">
            <HeroCard />
          </div>
        </div>
      </section>

      {/* ===================== DONATION TICKER ===================== */}
      <section aria-hidden className="border-y border-line bg-card/60 py-3.5">
        <div className="flex w-max animate-marquee gap-3 whitespace-nowrap">
          {[...RECENT_DONATIONS, ...RECENT_DONATIONS].map((d, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-1.5 text-sm text-ink-soft">
              <Heart size={13} className="fill-blue text-blue" />
              <span className="font-semibold text-ink">{d.name}</span> backed
              <span className="font-semibold text-ink">{d.campaign}</span>
              <span className="font-mono font-semibold text-blue">+{d.amount} SOL</span>
            </span>
          ))}
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how" className="scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="pill">How it works</span>
            <ScrollReveal
              containerClassName="!my-0 mt-5"
              textClassName="font-display !text-4xl sm:!text-5xl !leading-tight text-ink"
              baseOpacity={0.12}
              baseRotation={2}
              blurStrength={5}
            >
              From a goal to a token in three steps
            </ScrollReveal>
          </div>

          <div className="relative mt-12 grid gap-6 md:grid-cols-3">
            <div aria-hidden className="absolute left-[16%] right-[16%] top-12 hidden border-t-2 border-dashed border-line md:block" />
            {[
              { n: '01', Icon: Target, title: 'Launch a campaign', desc: 'Set a goal, tell your story, pick a token name. Donations land in an on-chain escrow — fully refundable if the goal isn’t met.' },
              { n: '02', Icon: Users, title: 'Rally your backers', desc: 'Supporters chip in SOL. Every contribution is tracked transparently, and the leaderboard ranks your biggest believers.' },
              { n: '03', Icon: Rocket, title: 'Launch & reward', desc: 'Hit your goal and launch the token on Pump.fun. Your top 9 backers are locked in as fee-sharing recipients — automatically.' },
            ].map((s, i) => (
              <AnimatedContent key={s.n} delay={i * 0.12} distance={60} duration={0.7}>
                <div className="relative rounded-4xl border border-line bg-card p-7 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-wash text-blue"><s.Icon size={22} strokeWidth={1.8} /></span>
                    <span className="font-mono text-sm font-bold text-ink-faint">{s.n}</span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{s.desc}</p>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== REWARDS (CardSwap showcase) ===================== */}
      <section id="rewards" className="scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-5xl border border-ink/10 bg-ink p-8 text-paper shadow-lift sm:p-14">
          <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(circle, #2563eb, transparent 70%)' }} />
          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3.5 py-1.5 text-sm font-medium">
                <ShinyText text="The part nobody else does" color="#93C5FD" shineColor="#ffffff" speed={3} />
              </span>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-paper sm:text-5xl">
                Your backers don’t just give. They <span className="text-sky">earn</span>.
              </h2>
              <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-paper/70">
                When your token launches, Pump.fun’s native fee-sharing splits the
                creator trading fees between you and your top 9 backers — locked
                on-chain at launch, paid out forever.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  'Up to 10 wallets share the fees (you + top 9 backers)',
                  'Locked permanently the moment you launch',
                  'Anyone can trigger payouts — fully permissionless',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-paper/85">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue text-white"><Check size={12} strokeWidth={3} /></span>
                    <span className="text-[0.95rem]">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CardSwap fee showcase */}
            <div className="relative hidden h-[340px] lg:block">
              <CardSwap width={300} height={196} cardDistance={48} verticalDistance={54} delay={2600} skewAmount={5} pauseOnHover easing="elastic">
                {FEE_CARDS.map((f) => (
                  <Card key={f.label} customClass={`!border-white/10 bg-gradient-to-br ${f.tint} p-7`}>
                    <div className="text-xs uppercase tracking-[0.16em] text-paper/60">Creator fee share</div>
                    <div className="mt-6 font-mono text-5xl font-bold text-paper">{f.share}</div>
                    <div className="mt-2 font-display text-lg text-paper/90">{f.label}</div>
                    <div className="mt-5 text-xs text-paper/45">Locked on-chain at launch · paid forever</div>
                  </Card>
                ))}
              </CardSwap>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURED CAMPAIGNS ===================== */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="pill">Live now</span>
              <ScrollReveal
                containerClassName="!my-0 mt-5"
                textClassName="font-display !text-4xl sm:!text-5xl !leading-tight text-ink"
                baseOpacity={0.12}
                baseRotation={2}
                blurStrength={5}
              >
                Campaigns worth backing
              </ScrollReveal>
            </div>
            <Link href="/campaigns" className="inline-flex items-center gap-1.5 font-semibold text-blue transition-colors hover:text-blue-deep">
              View all campaigns <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPAIGNS.map((c, i) => (
              <CampaignCard key={c.id} c={c} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA BAND ===================== */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-5xl bg-ink px-8 py-16 text-center shadow-lift sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at 80% 10%, rgba(37,99,235,0.55), transparent 55%)' }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold text-paper sm:text-5xl">
              Got something the world should fund?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-paper/70">
              Spin up a campaign in minutes. Reward the people who believed first.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnet padding={70} magnetStrength={4}>
                <Link href="/create" className="btn-primary px-8 text-base">Start your campaign</Link>
              </Magnet>
              <Link href="/campaigns" className="rounded-full border border-paper/25 px-8 py-3.5 font-semibold text-paper transition-colors hover:bg-paper/10">
                See what’s live
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-line px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-ink-soft sm:flex-row">
          <span className="font-display text-lg font-semibold text-ink">Pump<span className="text-blue">Fund</span></span>
          <span>Crowdfunding with upside · Built on Solana × Pump.fun</span>
          <span className="text-ink-faint">© {new Date().getFullYear()} PumpFund</span>
        </div>
      </footer>
    </main>
  );
}
