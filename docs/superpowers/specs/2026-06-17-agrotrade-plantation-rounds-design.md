# AgroTrade — Plantation Rounds (AgroVest) Design Spec

**Date:** 2026-06-17
**Scope:** Backend first — contracts + NestJS module + Prisma schema. Mobile app + landing page follow separately.

---

## What We're Building

A new **Plantation Rounds** pillar inside AgroTrade. Farmers tokenize their plantation assets (avocado groves, coffee trees, cocoa, etc.) into investment rounds. Multiple investors buy ERC-721 NFT shares denominated in cUSD. Each NFT represents fractional ownership of that harvest's proceeds. NFT holders can stake for yield between harvests. At harvest, the farmer triggers on-chain distribution and all NFT holders receive their cut in cUSD automatically.

This turns AgroTrade into a three-pillar ecosystem:
- **Trade** — existing logistics + escrow
- **Vault** — existing cUSD escrow safe
- **Invest** — plantation rounds (new)

---

## Smart Contracts (Foundry / Celo)

### 1. `PlantationRound.sol`

ERC-721 + fundraising escrow + distribution in a single contract.

**State machine:**
```
OPEN → FUNDED → ACTIVE → DISTRIBUTING → CLOSED
       (target    (farmer  (harvest       (all paid)
        reached)   unlocks   triggered)
                   capital)
```

**Key functions:**
- `createRound(cropType, targetCUSD, pricePerShareCUSD, harvestDeadline, metadataURI)` — seller calls; stores round on-chain; emits `RoundCreated`
- `invest(roundId, shareCount)` — investor calls; cUSD transferred from caller to contract; NFT(s) minted to caller; emits `SharesPurchased`
- `unlockCapital(roundId)` — admin-gated; releases escrowed cUSD to farmer once round is FUNDED; emits `CapitalUnlocked`
- `distributeHarvest(roundId, totalSaleCUSD)` — farmer calls after crop sold; pulls `totalSaleCUSD` cUSD from farmer wallet into contract; contract pays each NFT holder pro-rata; emits `HarvestDistributed`
- `claimDistribution(tokenId)` — NFT holder claims their payout (pull pattern, prevents gas griefing)

**NFT metadata (IPFS):**
```json
{
  "name": "Avocado Grove Round #3 — Share 12/100",
  "cropType": "avocado",
  "farmId": "...",
  "roundId": "...",
  "shareIndex": 12,
  "totalShares": 100,
  "sharePriceCUSD": "50",
  "harvestDeadline": "2027-03-01"
}
```

**Security invariants:**
- `invest()` reverts if round is not OPEN
- `unlockCapital()` only callable by admin (multi-sig in prod)
- `distributeHarvest()` only callable by round's original farmer wallet
- No re-entrancy: use Checks-Effects-Interactions + ReentrancyGuard
- cUSD amounts use 18 decimals — never truncate

### 2. `GroveStaking.sol`

Stake a PlantationRound NFT to earn yield while the crop grows.

- Yield pool is funded by a 2% protocol fee taken at `invest()` time
- Yield accrues linearly per block while staked
- `stake(tokenId)` — transfers NFT to staking contract, begins accrual
- `unstake(tokenId)` — returns NFT to owner, stops accrual
- `claimYield(tokenId)` — pays out accrued cUSD yield from pool
- Rate: configurable `yieldRatePerBlock` set by admin

**Test coverage required (Foundry):**
- Happy path: invest → stake → time passes → claim yield → unstake
- Edge: unstake before any yield accrues
- Edge: double-stake attempt reverts
- Distribution while staked (NFT still receives distribution on unstake)

---

## Backend — NestJS Module: `plantation-rounds`

Located at `backend/src/plantation-rounds/`. New module alongside existing `investments/`.

### Files

```
plantation-rounds/
├── plantation-rounds.module.ts
├── plantation-rounds.controller.ts
├── plantation-rounds.service.ts
├── plantation-nfts.service.ts       ← NFT ownership mirror + metadata
├── grove-staking.service.ts         ← staking interactions
├── dto/
│   ├── create-round.dto.ts
│   ├── invest.dto.ts
│   └── distribute-harvest.dto.ts
└── constants/
    └── contracts.constant.ts        ← deployed contract addresses
```

### REST API

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/plantation-rounds` | SELLER | Create a round |
| `GET` | `/plantation-rounds` | ANY | List open rounds (filter: cropType, minAPY, maxPrice) |
| `GET` | `/plantation-rounds/:id` | ANY | Round detail + funding progress |
| `POST` | `/plantation-rounds/:id/invest` | BUYER | Buy N shares → mint NFTs |
| `POST` | `/plantation-rounds/:id/distribute` | SELLER | Trigger harvest distribution |
| `GET` | `/plantation-rounds/portfolio` | BUYER | Investor's owned NFTs + staking status |
| `POST` | `/plantation-rounds/stake/:tokenId` | BUYER | Stake NFT |
| `POST` | `/plantation-rounds/unstake/:tokenId` | BUYER | Unstake NFT |
| `GET` | `/plantation-rounds/yield/:tokenId` | BUYER | Claimable yield |
| `POST` | `/plantation-rounds/claim/:tokenId` | BUYER | Claim yield payout |

### Service responsibilities

**PlantationRoundsService:**
- Creates off-chain round record in Prisma (mirrored from on-chain event)
- Calls `PlantationRound.sol` via ethers.js admin wallet for `unlockCapital`
- Listens to `SharesPurchased`, `HarvestDistributed` events to keep DB in sync
- Calculates projected APY from (historicalYieldData + currentRoundMetrics)

**PlantationNftsService:**
- Mirrors NFT ownership from on-chain to Prisma `PlantationNft` table
- Resolves token metadata from IPFS
- Powers the portfolio endpoint

**GroveStakingService:**
- Calls `GroveStaking.sol` via ethers.js
- Tracks staking positions in `StakingPosition` Prisma model
- Returns real-time yield estimates

---

## Prisma Schema Additions

```prisma
model PlantationRound {
  id               String   @id @default(cuid())
  onChainRoundId   Int      @unique   // uint256 from contract
  sellerId         String
  seller           User     @relation(fields: [sellerId], references: [id])
  cropType         String   // "avocado" | "coffee" | "cocoa" | "olive" | ...
  farmLocation     String
  targetCUSD       Decimal  @db.Decimal(36, 18)
  pricePerShareCUSD Decimal @db.Decimal(36, 18)
  totalShares      Int
  sharesSold       Int      @default(0)
  harvestDeadline  DateTime
  projectedApyPct  Decimal?
  status           PlantationRoundStatus @default(OPEN)
  metadataUri      String?
  contractAddress  String
  nfts             PlantationNft[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model PlantationNft {
  id          String   @id @default(cuid())
  tokenId     Int      @unique
  roundId     String
  round       PlantationRound @relation(fields: [roundId], references: [id])
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  shareIndex  Int
  staking     StakingPosition?
  createdAt   DateTime @default(now())
}

model StakingPosition {
  id            String   @id @default(cuid())
  nftId         String   @unique
  nft           PlantationNft @relation(fields: [nftId], references: [id])
  stakedAt      DateTime @default(now())
  unstakedAt    DateTime?
  claimedCUSD   Decimal  @default(0) @db.Decimal(36, 18)
}

enum PlantationRoundStatus {
  OPEN
  FUNDED
  ACTIVE
  DISTRIBUTING
  CLOSED
}
```

---

## Event Listeners

The backend runs a background listener on contract events to keep the DB in sync:

- `RoundCreated(roundId, seller, cropType, targetCUSD)` → creates `PlantationRound` record
- `SharesPurchased(roundId, investor, tokenIds[])` → creates `PlantationNft` records, increments `sharesSold`
- `CapitalUnlocked(roundId)` → updates status to `ACTIVE`
- `HarvestDistributed(roundId, totalCUSD)` → updates status to `DISTRIBUTING`

---

## Build Order

1. **Contracts** — `PlantationRound.sol` + `GroveStaking.sol` + Foundry tests
2. **Prisma** — add 3 new models + migration
3. **NestJS module** — DTOs → service → controller → wire into AppModule
4. **Event listeners** — background sync from contract events
5. **Integration tests** — full invest → stake → distribute flow on Celo Sepolia
6. **Mobile app** (next phase)
7. **Landing page sections** (last)

---

## Out of Scope (this spec)

- Secondary market / NFT trading between investors
- Governance voting on harvest decisions
- Multi-chain (Solana) deployment
- Landing page sections
- Mobile app UI (separate spec)
