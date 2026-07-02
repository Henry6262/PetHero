import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solana Event Pass — Your Web3 Event Companion",
  description:
    "One app for your Solana events. Agenda, wallet, payments, POAPs, and an AI assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0b0913] text-[#f4f1ff]">
        {children}
      </body>
    </html>
  );
}
