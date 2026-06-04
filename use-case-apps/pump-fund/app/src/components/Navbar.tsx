'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import PillNav from '@/components/reactbits/PillNav';

// Inline mark (wave + coin) rendered inside PillNav's logo circle.
const LOGO =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2040%2040'%3E%3Cpath%20d='M6%2024c5-2%208-15%2014-15s9%2013%2014%2015'%20stroke='%2393C5FD'%20stroke-width='3'%20fill='none'%20stroke-linecap='round'/%3E%3Ccircle%20cx='20'%20cy='27'%20r='5.5'%20fill='%232563EB'/%3E%3Cpath%20d='M20%2024v6M17%2027h6'%20stroke='%23F2F0EA'%20stroke-width='2'%20stroke-linecap='round'/%3E%3C/svg%3E";

export default function Navbar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="relative mx-auto h-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <PillNav
          logo={LOGO}
          logoAlt="PumpFund"
          logoHref="/"
          items={[
            { label: 'Explore', href: '/campaigns' },
            { label: 'How it works', href: '/#how' },
            { label: 'Rewards', href: '/#rewards' },
          ]}
          baseColor="#11151C"
          pillColor="#FBFAF6"
          pillTextColor="#11151C"
          hoveredPillTextColor="#F2F0EA"
          className="!left-4 sm:!left-6 lg:!left-8"
        />

        <div className="absolute right-4 top-[1em] hidden items-center gap-2 sm:right-6 md:flex lg:right-8">
          <Link
            href="/create"
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink transition-colors hover:text-blue"
          >
            Start a campaign
          </Link>
          <WalletMultiButton className="!h-[42px] !rounded-full !bg-ink !px-4 !py-0 !font-sans !text-sm !font-semibold !text-paper hover:!-translate-y-0.5 !transition-transform" />
        </div>
      </div>
    </div>
  );
}
