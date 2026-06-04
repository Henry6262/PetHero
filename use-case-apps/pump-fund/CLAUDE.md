# PumpFund

## Goal

One-click Pump.fun token launcher combined with GoFundMe-style crowdfunding.
Creator + top 9 donors earn creator fee shares via Pump.fun native fee-sharing
(hard cap is 10 fee-sharing wallets on-chain).

## Current Reality

- **Path:** `use-case-apps/pump-fund/`
- **Stack:** Anchor 0.30.1 + Next.js 15 + Tailwind + `@pump-fun/pump-sdk`
- **Network:** Devnet (mainnet target)
- **Wallet:** Solana Wallet Adapter (Phantom, Solflare)

## Architecture

### On-chain (Anchor)
- `ProgramState` — authority + platform fee (2%) + campaign counter
- `Campaign` — creator, goal, raised, deadline, status, mint
- `Donation` — donor -> amount mapping per campaign
- Vault PDA holds SOL for each campaign

### Off-chain (Next.js)
- `/` — landing page
- `/campaigns` — explore all campaigns (fetches program accounts)
- `/campaigns/[id]` — campaign detail + donate/launch
- `/create` — campaign creation form

### Pump.fun Integration
- Uses `@pump-fun/pump-sdk` v1.35.0 (same as sub-deployer)
- `createV2Instruction` for token creation
- `createFeeSharingConfig` + `updateFeeShares` to reward top donors

## Design System (editorial light — off-white / ink / electric blue)

- Bone-white theme: paper `#F2F0EA`, ink `#11151C`, card `#FBFAF6`
- Single accent: electric blue `#1D4ED8` (bright `#2563EB`, deep `#1E3A8A`, wash `#E6ECFB`) + sky `#93C5FD`
- Fonts: Fraunces (display serif) + Hanken Grotesk (body) + Spline Sans Mono (SOL figures)
- NO EMOJIS — use `lucide-react` icons everywhere (see `components/CategoryIcon.tsx`)
- Rounded-full buttons/pills; `rounded-4xl/5xl` cards; soft/lift shadows; faint SVG grain on body
- Reusable classes: `.btn-primary/.btn-ink/.btn-ghost`, `.card`, `.pill`, `.input`, `.label`, `.track`
- **React Bits** vendored in `components/reactbits/` (`'use client'`): PillNav (nav, patched:
  react-router→next/link shim + `logoHref` prop), SoftAurora (hero shader), SplitText (headline),
  CountUp (stats), CardSwap (rewards fee-share showcase), ScrollReveal (heading word-reveal),
  ShinyText (eyebrows), Magnet (CTAs), SpotlightCard (cards), AnimatedContent (scroll reveals).
  Source: `react-bits-vault/` (see its CATALOG.md, 230 comps). Deps: ogl, gsap, @gsap/react, motion, lucide-react.
  Note: `scripts/` excluded from tsconfig (run via `npx tsx`, not part of Next build typecheck).
- Shared UI: `components/CampaignCard.tsx`; mock data in `lib/mock.ts` (gradient covers + lucide icon, no assets)
- Wallet-adapter button restyled to ink pill via `.wallet-adapter-button-trigger` override in globals.css

## Key Decisions

1. **Fee sharing via Pump.fun native feature** — no custom reward distribution needed.
2. **Donation tracking on-chain** — transparent, trustless.
3. **Vault PDA per campaign** — SOL held in program-controlled account.
4. **Refunds if goal not met** — donors protected if campaign fails.

## Working Rules

- Keep frontend wallet interactions in hooks (`useProgram.ts`)
- All Pump.fun SDK calls in `lib/pumpfun.ts`
- Anchor IDL manually maintained in `app/src/idl/pump_fund.json`
- Use `react-hot-toast` for user feedback

## Next Milestones

1. Deploy program to devnet + update IDL with real program ID
2. Wire up Pump.fun token creation in the launch flow
3. Add leaderboard (top donors) to campaign detail
4. Test end-to-end: create → donate → launch → fee share
5. Add social links (Twitter, Telegram) to campaign metadata
