"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const nav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Waitlist", href: "#waitlist" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0b0913]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#9945FF] to-[#14F195]">
            <div className="h-3 w-3 rotate-45 rounded-sm border-[2.5px] border-[#0b0913]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Solana Event Pass
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-[#b9b2d0] transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#waitlist"
            className="rounded-full bg-gradient-to-r from-[#9945FF] to-[#7a33e0] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition-transform hover:scale-105"
          >
            Get early access
          </a>
        </nav>

        <button
          className="text-white md:hidden"
          onClick={() => setOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] bg-[#0b0913]/95 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-[#b9b2d0] hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#waitlist"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gradient-to-r from-[#9945FF] to-[#7a33e0] px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              Get early access
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
