import type { Metadata } from 'next';
import './globals.css';
import WalletProvider from '@/components/WalletProvider';
import SmoothScroll from '@/components/SmoothScroll';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'PumpFund — Fund the dream. Share the upside.',
  description:
    'Crowdfund a vision in SOL, then launch its token in one click. Your top backers earn a share of creator trading fees — forever, on-chain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <WalletProvider>
          <SmoothScroll />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#15251c',
                color: '#fbf8f1',
                border: '1px solid rgba(251,248,241,0.12)',
                borderRadius: '14px',
                fontFamily: 'Hanken Grotesk, sans-serif',
                fontWeight: 500,
              },
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
