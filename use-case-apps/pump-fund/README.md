# PumpFund

One-click Pump.fun token launcher + GoFundMe-style crowdfunding with on-chain donor rewards.

## The Idea

1. **Create a campaign** — set a funding goal, describe your vision, upload your token image.
2. **Collect donations** — backers send SOL to an on-chain vault. Everything is transparent.
3. **Launch your token** — when ready, create your Pump.fun token in one click.
4. **Reward donors** — Pump.fun's native fee-sharing automatically splits creator trading fees between you and your top 3 donors forever.

## Architecture

| Layer | Tech |
|-------|------|
| Smart Contract | Anchor 0.30.1 (Rust) |
| Frontend | Next.js 15 + TypeScript + Tailwind |
| Wallet | Solana Wallet Adapter (Phantom, Solflare) |
| Token Launch | `@pump-fun/pump-sdk` v1.35.0 |
| Network | Devnet → Mainnet |

## Smart Contract (`programs/pump_fund`)

- `initialize` — program state with platform fee (2%)
- `create_campaign` — create a campaign PDA + vault
- `donate` — send SOL to vault, record donation
- `launch_token` — mark launched, distribute funds (creator gets 98%, platform 2%)
- `claim_refund` — if campaign expires without reaching goal, donors can refund

## Fee Sharing (Pump.fun native)

When launching, the creator configures Pump.fun fee sharing:
- Creator: 40%
- #1 Donor: 35%
- #2 Donor: 15%
- #3 Donor: 10%

This is done via `createFeeSharingConfig` + `updateFeeShares` from the Pump.fun SDK.

## Development

```bash
# Install dependencies
pnpm install

# Build the program
anchor build

# Start local validator
solana-test-validator

# Deploy & test
anchor test

# Run frontend
pnpm dev
```

## Project Structure

```
pump-fund/
├── Anchor.toml              # Anchor config
├── Cargo.toml               # Rust workspace
├── programs/
│   └── pump_fund/
│       ├── Cargo.toml
│       └── src/lib.rs       # Anchor program
├── app/                     # Next.js frontend
│   ├── src/
│   │   ├── app/             # Pages (Next.js App Router)
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── idl/             # Anchor IDL
│   │   ├── lib/             # Utilities (anchor client, pumpfun SDK wrapper)
│   │   └── types/           # TypeScript types
│   └── package.json
└── tests/                   # Anchor tests
```

## Environment Variables

Create `app/.env.local`:

```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Status

- [x] Anchor program (escrow + donations + launch)
- [x] Frontend scaffold (Next.js + wallet adapter)
- [x] Pump.fun SDK integration
- [ ] Program deployed to devnet
- [ ] End-to-end testing
- [ ] Mainnet migration
