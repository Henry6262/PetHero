const steps = [
  {
    step: "01",
    title: "Connect in seconds",
    desc: "Create a wallet with one tap or link your existing Solana wallet.",
  },
  {
    step: "02",
    title: "Get your agenda",
    desc: "Sol pulls in the events you’re registered for and builds your schedule.",
  },
  {
    step: "03",
    title: "Tap to pay & collect",
    desc: "Buy drinks, split checks, and grab POAPs without leaving the app.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-[#8b84a3]">
            Three steps from download to fully-loaded event experience.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.step}
              className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#110e1a] p-8"
            >
              <span className="absolute -right-4 -top-6 text-8xl font-bold text-white/[0.03]">
                {s.step}
              </span>
              <span className="text-sm font-bold uppercase tracking-widest text-[#9945FF]">
                Step {s.step}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-3 leading-relaxed text-[#8b84a3]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
