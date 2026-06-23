**Piggy v1 – Product Requirements Document (PRD)**

**Version:** 1.2 (Updated with Nimiq Mini Apps Gas & Account Abstraction Strategy)
**Date:** June 23, 2026
**Status:** Ready for Development
**Cycle:** Nimiq Mini Apps Competition – Cycle 1 (4 weeks)
**Platform:** Nimiq Pay Mini App (mobile-first web app, runs embedded inside Nimiq Pay)
**Tech Foundation:** Nimiq Mini App SDK (Nimiq + Ethereum wallet providers) for wallet/identity + viem for EVM calls on Polygon + Aave V3 for yield/borrowing

---

### Changelog (v1.1 → v1.2)
- Added Section 8.5: Gas & Account Abstraction Strategy, grounded in current Nimiq Mini Apps documentation (nimiq.dev).
- Updated Tech Foundation framing: Nimiq Mini Apps inject *both* a Nimiq provider and an Ethereum/EVM provider — the EVM side is what lets us reach Aave directly from inside Nimiq Pay, no separate dApp browser needed.
- Added risk: Mini Apps framework is newly launched and still in active testing as of this writing.

---

### 1. Executive Summary

**Piggy** is a mobile-first savings and borrowing Mini App inside **Nimiq Pay**. It helps users save stablecoins, earn optional yield, borrow against their savings, hit personal goals, and participate in social savings challenges.

**Core value**: "Save smarter, borrow against your savings, hit goals, and save together with friends — all inside Nimiq Pay."

**v1 Scope**: Deliver a complete, shippable MVP covering:
- Personal savings vault with optional Aave yield
- Borrowing against the vault
- Recurring savings
- Targeted / goal-oriented savings vaults
- Social "Save with Frens" challenges with streaks and leaderboards

This gives users a full savings experience while remaining feasible to build and demo in one 4-week cycle.

---

### 2. Problem Statement

Users want simple ways to:
- Save stablecoins consistently
- Earn yield without complexity
- Access liquidity without selling their savings
- Stay motivated toward specific financial goals
- Save together with others in a fun, social way

Nimiq Pay currently lacks dedicated savings tools. Piggy fills this gap with a delightful, gamified, and practical experience — and Nimiq's new Mini Apps framework is explicitly designed for exactly this: bringing Ethereum-side DeFi protocols like Aave into Nimiq Pay without users ever leaving the app.

---

### 3. Target Users

**Primary**: Mobile users who want practical financial tools inside Nimiq Pay. They value simplicity, self-custody, and features that help them actually save and stay motivated.

**Secondary**: Users interested in light DeFi yield and social/fun elements around money.

---

### 4. Product Vision & Principles

**Vision**: The most approachable savings companion inside Nimiq Pay — combining yield, borrowing, goals, and social motivation.

**Principles**:
- Mobile-first with bottom navigation
- Inherit Nimiq Pay profile and wallet
- Hide complexity, show clarity
- Self-custodial by default
- Fun but responsible (gamification without risk encouragement)

---

### 5. Scope

#### In Scope (v1)

**Core Features**:
- Deposit / Withdraw to Piggy Vault (USDC on Polygon)
- Optional Yield via Aave V3 on Polygon
- Borrow against Vault + Repay
- Recurring (DCA-style) Savings
- Targeted / Goal-oriented Savings Vaults
- Save with Frens Challenges (streaks + leaderboards)

**Nice-to-Haves (Included in v1)**:
- Dynamic interest rate calculator (duration + vault age)
- Vault age / loyalty indicator
- Liquidation warnings + simple simulator
- Clear risk explanations throughout

#### Out of Scope (v1)
- Piggy Agent (AI features)
- Full P2P lending marketplace
- Custom smart contracts for lending
- Multi-chain support
- Push notifications
- Advanced on-chain social features

---

### 6. User Experience & Navigation

**Bottom Navigation (Mobile-First)**:
1. **Home** – Dashboard
2. **Vault** – Personal savings & yield
3. **Goals** – Targeted savings
4. **Borrow**
5. **Challenges** – Save with Frens
6. **Profile** (inherits Nimiq Pay)

---

### 7. Detailed Features

#### 7.1 Dashboard (Home)
- Total Vault Balance
- Yield Earned (if enabled)
- Total Borrowed + Health Factor
- Active Goals progress
- Active Challenges + current streak
- Quick actions: Deposit, Borrow, Join Challenge

#### 7.2 Vault Tab (Core Savings)
- Deposit & Withdraw USDC
- **Yield Toggle**:
  - Off → Funds in vault
  - On → Supplied to Aave V3 → Shows live APY and estimated earnings
- Vault Age indicator (days since first deposit)
- Dynamic rate preview

#### 7.3 Goals Tab (Targeted Savings)
Users can create multiple goal-oriented vaults:
- Goal name (Vacation, Rent, New Car, Emergency Fund, etc.)
- Target amount
- Target date (optional)
- Progress bar + remaining amount
- Ability to allocate deposits to specific goals
- Option to move funds between goals or main vault

This allows users to have both a general vault and multiple targeted savings pots.

#### 7.4 Borrow Tab
- View available borrow amount based on vault collateral (via Aave)
- Borrow flow with amount input and dynamic interest preview
- Active loan details:
  - Borrowed amount
  - Interest accrued
  - Health factor
  - Repay button
- Dynamic interest rates (base Aave rate + duration multiplier + vault age bonus)
- Simple liquidation warning + health factor simulator

#### 7.5 Challenges Tab – "Save with Frens"
Social and gamified savings feature:
- Browse and join public challenges (e.g., "Save $10 Daily", "Save $50 Weekly", "30-Day Savings Streak")
- Create private challenges and invite friends (via Nimiq Pay contacts or shareable link)
- Personal streak counter
- Leaderboard (top savers in the challenge — amount saved or consistency)
- Challenge rules and progress tracking
- Social sharing for virality ("I just joined the $10 Daily challenge!")

**v1 Implementation Notes**:
- Challenges can be time-bound (7, 14, 30 days)
- Streaks reset on missed days
- Leaderboard based on total saved during challenge period (simple on-chain or hybrid tracking)
- Viral loop through easy sharing and friend invites

#### 7.6 Recurring Savings
- Set up automatic weekly or monthly deposits from Nimiq Pay balance
- Option to allocate to specific Goals or general Vault
- Pause, edit, or cancel recurring schedules
- History of recurring deposits

#### 7.7 Profile (Inherited)
- Uses Nimiq Pay profile data
- Overall stats: Total saved, Total yield earned, Longest streak, Goals completed, Challenges joined
- Settings and risk disclosures

---

### 8. Technical Requirements

#### 8.1 Wallet & Identity
- Use the **Nimiq Mini App SDK** for connection and profile inheritance
- Nimiq Pay injects two providers into the Mini App context: a **Nimiq provider** (NIM, native rails) and an **Ethereum/EVM provider** (for Polygon-side contract calls). Piggy uses both — Nimiq provider for app context/identity, EVM provider for all Aave-side balance, deposit, yield, and borrow logic
- All transactions signed within Nimiq Pay's native confirmation dialogs — the Mini App never handles raw keys

#### 8.2 Blockchain
- Chain: Polygon (USDC)
- Yield & Borrowing: Aave V3 on Polygon (wrapper approach)
- Use viem + Aave SDK for clean integration against the EVM provider injected by Nimiq Pay

#### 8.3 State
- On-chain for balances, positions, and Aave interactions
- Hybrid (on-chain + local/app state) for goals, recurring schedules, and challenges/streaks

#### 8.4 Key Integrations
- Nimiq Mini App SDK
- Aave V3 Polygon contracts
- Simple challenge tracking (can start with on-chain events + lightweight indexing)

#### 8.5 Gas & Account Abstraction Strategy

Nimiq Pay's wallet already ships with native gas abstraction for plain USDC/USDT transfers on Polygon — the wallet manages gas behind the scenes for simple sends, so users never need to hold POL. This is a real, existing platform capability, not something we need to build. The catch: it's scoped to basic transfers, not arbitrary smart-contract calls. Aave's `supply`, `withdraw`, `borrow`, and `repay` are contract calls, so they fall outside that native coverage.

**Recommended hybrid for v1:**

| Flow | Mechanism | Why |
|---|---|---|
| Deposit, Withdraw, Recurring | Native Nimiq Pay gas abstraction | These are structured as straightforward USDC/USDT transfers into the Piggy vault — exactly what Nimiq's built-in abstraction already covers, at no extra integration cost |
| Yield toggle, Borrow, Repay | ERC-4337 account abstraction via Pimlico or Alchemy paymaster | These require direct Aave contract calls, which sit outside native transfer-only coverage |
| v1 default | App-sponsored gas (we cover the cost) | Keeps onboarding frictionless and removes the "I need POL" cliff entirely for the demo and early users |
| UI | Explicit in-app messaging whenever POL/gas could be needed (e.g., sponsorship cap reached, fallback path) | Self-custodial transparency — never silently fail a transaction on gas |

**Open technical question to validate in week 1 (flag as a build risk, not a blocker):** confirm whether the Ethereum provider Nimiq Pay injects into Mini Apps is a plain EOA or already account-abstraction-ready. If it's a plain EOA, the borrow/yield flows will need either a counterfactual smart account deployed behind it or an EIP-7702 delegation step before a paymaster can sponsor anything. This is a half-day spike, best done before committing to a specific paymaster provider.

This hybrid keeps the UX excellent (no gas friction anywhere in the user journey) while staying technically honest about what Nimiq already gives us for free versus what we need to build ourselves.

#### 8.6 Security
- Self-custodial design
- Clear warnings before any DeFi action
- Health factor protection messaging

---

### 9. Design & UX Requirements

- **Mobile-first** with bottom tab navigation
- Large, thumb-friendly buttons and inputs
- Friendly "Piggy" visual language (warm, trustworthy, slightly playful)
- Progressive disclosure of DeFi details
- Consistent use of color for status (yield on/off, health factor, streak status)
- Clear explanations and tooltips for every DeFi concept

---

### 10. Risks & Mitigations

| Risk                        | Mitigation |
|----------------------------|----------|
| Scope creep with new features | Strict MVP definition + phased rollout within cycle |
| Aave integration complexity | Use official SDK + early testnet validation |
| Gamification abuse         | Clear rules + responsible design messaging |
| User confusion on liquidation | Strong UI warnings + simulator |
| Performance in WebView     | Optimize bundle and lazy-load heavy components |
| Mini Apps framework is newly launched and still in active testing | Engage directly with the Nimiq dev community/Discord early, validate provider behavior (EOA vs. AA-ready) in week 1, build with a fallback path in case specific provider methods aren't yet stable |
| Paymaster sponsorship costs at scale | Start app-sponsored, monitor spend, add per-user caps or move to ERC-20 paymaster mode (gas paid in USDC) if costs grow |

---

### 11. Success Criteria for v1

By the end of the 4-week cycle, a user should be able to:
1. Deposit USDC and toggle yield
2. Create a targeted savings goal and allocate funds to it
3. Borrow against their vault while seeing health factor
4. Set up recurring savings
5. Join or create a "Save with Frens" challenge and see their streak + leaderboard position
6. Complete the full journey with clear understanding of risks and mechanics
7. Do all of the above without ever being asked to acquire POL/MATIC manually

---

### 12. Development Guidelines

- Build mobile-first from day one
- Use the Nimiq Mini App SDK for all wallet and profile interactions; treat the injected Ethereum provider as the integration point for all Aave-side logic
- Spike the EOA-vs-AA question on the injected EVM provider before locking in a paymaster vendor
- Create reusable components for vault, goal, and challenge cards
- Implement feature flags for Yield, Goals, and Challenges
- Prioritize clear error handling and user-friendly transaction feedback, especially around gas sponsorship fallbacks
- Document all contract addresses and integration points

---

This v1.2 PRD incorporates the gas and account abstraction strategy for the Nimiq Mini Apps platform, grounded in Nimiq's current developer documentation (nimiq.dev) and the Mini Apps Framework launch announcement.
