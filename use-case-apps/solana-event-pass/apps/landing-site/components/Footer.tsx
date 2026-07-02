export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-12 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#9945FF] to-[#14F195]">
            <div className="h-2.5 w-2.5 rotate-45 rounded-sm border-2 border-[#0b0913]" />
          </div>
          <span className="text-sm font-semibold text-white">
            Solana Event Pass
          </span>
        </div>
        <p className="text-sm text-[#8b84a3]">
          © {new Date().getFullYear()} Solana Event Pass. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-[#8b84a3]">
          <a href="#" className="hover:text-white">
            Privacy
          </a>
          <a href="#" className="hover:text-white">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
