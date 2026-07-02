import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

function Badge() {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
      <Sparkles size={14} className="text-[#14F195]" />
      <span className="text-xs font-semibold uppercase tracking-wider text-[#b9b2d0]">
        Built on Solana
      </span>
    </div>
  );
}

function Title({ className = "" }: { className?: string }) {
  return (
    <h1
      className={`text-5xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-2xl sm:text-6xl lg:text-7xl ${className}`}
    >
      Your whole event,
      <br />
      <span className="bg-gradient-to-r from-[#9945FF] via-[#cba6ff] to-[#14F195] bg-clip-text text-transparent">
        in one tap.
      </span>
    </h1>
  );
}

function Subtitle({ className = "" }: { className?: string }) {
  return (
    <p
      className={`max-w-lg text-lg leading-relaxed text-[#b9b2d0] drop-shadow-md sm:text-xl ${className}`}
    >
      Agenda, wallet, payments, POAPs, and an AI assistant for every Solana
      event. No more switching apps.
    </p>
  );
}

function CTAs({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row ${className}`}>
      <a
        href="#waitlist"
        className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#7a33e0] px-8 text-base font-semibold text-white shadow-xl shadow-purple-900/40 transition-transform hover:scale-105"
      >
        Get early access
        <ArrowRight
          size={18}
          className="transition-transform group-hover:translate-x-1"
        />
      </a>
      <a
        href="#features"
        className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
      >
        See how it works
      </a>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Desktop: big image on the right, blended into the background */}
      <div className="absolute right-0 top-1/2 hidden h-[96vh] w-[72vw] -translate-y-1/2 lg:block">
        <Image
          src="/hero-bg.png"
          alt="Solana Event Pass hero"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Left edge fade for text readability only */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0913]/90 via-[#0b0913]/30 via-25% to-transparent" />
        {/* Border vignette only — keeps the image bright in the center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(11,9,19,0.8)_100%)]" />
      </div>

      <div className="relative z-20 mx-auto hidden h-screen max-w-7xl items-center px-6 lg:flex lg:px-8">
        <div className="max-w-xl">
          <Badge />
          <Title />
          <Subtitle className="mt-6" />
          <CTAs className="mt-10" />
        </div>
      </div>

      {/* Mobile: title at the top over heavily darkened image, then copy + CTAs */}
      <div className="relative flex min-h-[80vh] flex-col items-start justify-start overflow-hidden lg:hidden">
        <Image
          src="/hero-bg.png"
          alt="Solana Event Pass hero"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0913]/95 via-[#0b0913]/60 to-[#0b0913]/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top, rgba(11,9,19,0.95),transparent_60%)]" />

        <div className="relative z-10 px-6 pb-12 pt-32">
          <Badge />
          <Title className="text-4xl sm:text-5xl" />
        </div>
      </div>

      <div className="px-6 py-14 lg:hidden">
        <Subtitle />
        <CTAs className="mt-8" />
      </div>
    </section>
  );
}
