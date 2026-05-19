# 🚀 Strategy: Scaling $10 to $100 (The "Micro-Flipper" Roadmap)

This research outlines the exact tactical path to turning a $10 initial balance into $100 using the **CS2 Edge** automation engine.

## 📊 The Core Principle: Velocity over Margin
At a $10 balance, you cannot afford "long holds." A 20% profit that takes 7 days to realize is worse than a 3% profit that settles in 4 hours.
- **Target turnover:** 2-3 trades per day.
- **Target profit per trade:** $0.30 - $0.80.

## 🛠 Phase 1: The "Case & Capsule" Grind ($10 → $30)
*Duration: 1-3 Days*

The most liquid items in CS2 are cases and major capsules.
1. **DMarket Sniping:** Use the `DmarketClient` to monitor for "Instantly Tradable" cases listed at 5-8% below the Buff.163 floor.
2. **Skinport Buy Orders:** Place low-ball buy orders for high-volume cases (Kilowatt, Revolution, Dreams & Nightmares).
3. **Execution:**
   - Buy for: $0.80
   - Sell for: $0.92 (after fees)
   - Profit: $0.12
   - Repeat: 10 times simultaneously.

## ⚡ Phase 2: Liquid Skin Arbitrage ($30 → $60)
*Duration: 3-5 Days*

Once you hit $30, move into "liquid" skins (Field-Tested Redlines, Slate, Mainframe, etc.).
1. **Cross-Market Snipes:**
   - Detect item on **DMarket** (P2P) listed for $5.00.
   - Check **Skinport** median: $6.50.
   - Buy on DMarket -> List on Skinport.
2. **Float Hunting:** The engine now identifies "Low Float" items in the bottom 5% of their wear class. These sell for 10-15% over floor.

## 🤖 Phase 3: Automated Momentum Trading ($60 → $100)
*Duration: 5-7 Days*

Enable the **Execution Bot** with strict filters:
- **Min Score:** 50
- **Min Volume:** 20+ sales/day
- **Max Price:** $15.00
- **Confidence Threshold:** 0.85 (ML Model)

The bot will automatically snipe opportunities as they appear on the WebSocket feeds (Skinport/Bitskins) and notify via the Dashboard.

## ⚠️ Risk Management
- **Never hold >20% in one item:** A price crash in one specific skin shouldn't wipe out your bankroll.
- **Avoid "Niche" items:** No souvenir skins, no high-tier stickers on low-tier skins (Katowice 2014 excepted, but you can't afford them yet).
- **Trade Lock Awareness:** Prioritize items with <3 days trade lock to maintain capital velocity.

## 📈 Milestone Goals
- [ ] **Milestone 1:** $25 (Buy orders successful)
- [ ] **Milestone 2:** $50 (First successful multi-market arbitrage)
- [ ] **Milestone 3:** $100 (Bot-assisted scaling)
