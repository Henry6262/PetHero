import { Calendar, Wallet, Ticket, Bot } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Live agenda",
    desc: "See every talk, side event, and update in real time. Never miss a thing.",
  },
  {
    icon: Wallet,
    title: "Built-in wallet",
    desc: "Top up, pay, and split bills with BRK tokens — no external wallet needed.",
  },
  {
    icon: Ticket,
    title: "POAPs & tickets",
    desc: "Collect proof-of-attendance badges and keep tickets in one place.",
  },
  {
    icon: Bot,
    title: "Ask Sol",
    desc: "Your AI event buddy. Recommendations, reminders, and answers on demand.",
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="relative z-10 px-6 pb-24 pt-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-3xl border border-white/[0.07] bg-[#15111f]/80 p-6 backdrop-blur-sm transition-transform hover:-translate-y-1 hover:border-purple-500/30"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 text-[#14F195]">
              <f.icon size={22} />
            </div>
            <h3 className="text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#8b84a3]">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
