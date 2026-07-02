"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section id="waitlist" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[40px] border border-white/[0.08] bg-gradient-to-br from-[#1a1230] to-[#110e1a] p-10 text-center shadow-2xl shadow-purple-900/20 sm:p-16">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Be first in line
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[#b9b2d0]">
          Join the waitlist and get early access to Solana Event Pass before the
          next major conference.
        </p>

        {submitted ? (
          <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 px-6 py-3 text-[#14F195]">
            <Check size={18} />
            <span className="font-medium">You&apos;re on the list.</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="enter@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 flex-1 rounded-full border border-white/[0.12] bg-white/5 px-6 text-white placeholder:text-[#8b84a3] outline-none transition-colors focus:border-[#9945FF]/50"
            />
            <button
              type="submit"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#7a33e0] px-7 text-base font-semibold text-white shadow-lg shadow-purple-900/40 transition-transform hover:scale-105"
            >
              Join waitlist
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
