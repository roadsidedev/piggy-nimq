# Piggy v1 — Task Tracklist

**Phases 0–9** from the Implementation Roadmap.  
Check off tasks as they're completed.

---

## Phase 0: Project Foundation (5%) ✅

### Repository & Tooling
- [x] Initialize repository (Git, .gitignore)
- [x] Configure TypeScript (strict mode)
- [x] Configure ESLint & Prettier
- [x] Set up Husky + lint-staged
- [ ] Set up GitHub Actions CI

### Core Dependencies
- [x] Install React + Vite
- [x] Install Tailwind CSS
- [x] Install TanStack Query
- [x] Install Zustand
- [x] Install React Hook Form
- [x] Install Zod
- [x] Install viem

### Folder Structure
- [x] Create `src/components/` with subdirectories
- [x] Create `src/features/` with subdirectories
- [x] Create `src/integrations/` (nimiq, aave, paymaster, wallet)
- [x] Create `src/hooks/`, `src/services/`, `src/stores/`, `src/types/`, `src/utils/`
- [x] Create `src/app/`, `src/assets/`

### UI Foundation
- [x] Define design system (typography, color palette, spacing)
- [x] Build mobile-first layout shell
- [x] Build bottom navigation component
- [x] Implement global theme provider
- [x] Build reusable Button component
- [x] Build reusable Card component
- [x] Build reusable Modal component
- [x] Build reusable Input component

**Milestone:** ✅ Project builds successfully with clean architecture and reusable UI components.

---

## Phase 1: Nimiq Mini App Integration (15%) ✅

### SDK Integration
- [x] Integrate Nimiq Mini App SDK
- [x] Detect wallet on mount
- [x] Load user profile from SDK
- [x] Access Nimiq provider
- [x] Access Ethereum/EVM provider
- [x] Validate Polygon network
- [x] Handle provider events (connect, disconnect, chain change)

### WalletService
- [x] Implement `connect()`
- [x] Implement `disconnect()`
- [x] Implement `getProfile()`
- [x] Implement `getAddress()`
- [x] Implement `switchChain()`

### Validation
- [ ] Wallet connects successfully (requires Nimiq Pay env)
- [ ] User profile loads (requires Nimiq Pay env)
- [ ] Message signing works (requires Nimiq Pay env)
- [ ] Test transaction succeeds on testnet (requires Nimiq Pay env)
- [ ] Network switching behaves correctly (requires Nimiq Pay env)

**Milestone:** ✅ Wallet service + hooks + connect screen built. End-to-end validation requires Nimiq Pay environment.

---

## Phase 2: Aave Integration (30%) ✅

### AaveService
- [x] Implement `supply()` / `deposit()`
- [x] Implement `withdraw()`
- [x] Implement `borrow()`
- [x] Implement `repay()`
- [x] Implement `getUserAccountData()` (health factor, available borrow)
- [x] Implement `getReserveData()` (APY, rates)
- [x] USDC approval flow (approve, allowance, max approve)

### Polygon Testnet
- [ ] Deploy test USDC (or use faucet) — requires testnet access
- [ ] Supply assets — requires testnet access
- [ ] Withdraw assets — requires testnet access
- [ ] Borrow against collateral — requires testnet access
- [ ] Repay loans — requires testnet access
- [ ] Health factor calculation — built, needs testnet validation
- [ ] Interest calculations — built, needs testnet validation

**Milestone:** ✅ AaveService built with full supply/withdraw/borrow/repay pipeline. Testnet validation pending.

---

## Phase 3: Vault MVP (45%)

### Vault Screen
- [ ] Display current balance
- [ ] Deposit flow
- [ ] Withdraw flow
- [ ] Yield toggle (on/off)
- [ ] Vault age indicator
- [ ] Transaction history list

### Components
- [ ] Vault Card
- [ ] Balance Card
- [ ] Deposit Modal
- [ ] Withdraw Modal
- [ ] Yield Toggle
- [ ] Transaction History

### State
- [ ] Vault balance
- [ ] Yield status
- [ ] APY display
- [ ] Earnings display

**Milestone:** Users can save funds, withdraw funds, and enable yield.

---

## Phase 4: Borrow Module (60%) ✅

### Dashboard
- [x] Available borrow amount
- [x] Borrowed amount
- [x] Health factor
- [x] Liquidation threshold

### Borrow Flow
- [x] Enter amount
- [x] Preview loan details
- [x] Confirm borrow
- [x] Execute transaction

### Repayment
- [x] Partial repayment
- [x] Full repayment

### Risk Simulator
- [x] Borrow amount → estimated health factor
- [x] Risk level indicator
- [x] Liquidation warnings
- [x] Educational tooltips

**Milestone:** ✅ Users can borrow and repay while understanding liquidation risk.

---

## Phase 5: Goals System (70%) ✅

### Goal Model
- [x] `id`
- [x] `title`
- [x] `targetAmount`
- [x] `currentAmount`
- [x] `targetDate`
- [x] `createdAt`

### CRUD
- [x] Create goal
- [x] Edit goal (via updateGoal)
- [x] Delete goal (with confirmation modal)
- [x] Allocate funds to goal
- [x] Transfer funds between goals
- [x] Track progress

### UI
- [x] Goal Cards
- [x] Progress Bar
- [x] Celebration banner on goal completion

**Milestone:** ✅ Users can organize savings into multiple targeted vaults.

---

## Phase 6: Recurring Savings (78%) ✅

### Schedule Management
- [x] Weekly schedules
- [x] Monthly schedules
- [x] Pause schedule
- [x] Resume schedule
- [x] Edit schedule
- [x] Delete schedule

### Dashboard
- [x] Schedule list with status
- [x] Goal allocation on create

### Enhancements
- [ ] Upcoming deposits view (deferred)
- [ ] Deposit history (deferred)
- [ ] Missed deposits indicator (deferred)
- [ ] Reminder banners (deferred)

**Milestone:** ✅ Users can automate recurring savings.

---

## Phase 7: Save with Frens (88%) ✅

### Public Challenges
- [x] Browse challenges
- [x] Search challenges
- [x] Join challenge
- [x] Leave challenge

### Private Challenges
- [x] Create challenge
- [x] Invite friends (invite model in place)
- [ ] Share invite links

### Challenge Model
- [x] Owner
- [x] Members
- [x] Target
- [x] Frequency
- [x] Duration
- [x] Leaderboard
- [x] Streak

### Leaderboards
- [x] Highest savings (sorted by saved amount)
- [x] Longest streak

### Social Features
- [x] Invite friends
- [ ] Share progress (deferred)
- [ ] Share achievements (deferred)

**Milestone:** ✅ Users can participate in social savings challenges.

---

## Phase 8: Gas & Account Abstraction (93%) ✅

### Implementation
- [x] Native Nimiq gas abstraction for transfers
- [x] ERC-4337 Paymaster service abstraction
- [x] Sponsorship logic
- [x] Fallback handling (native gas fallback)
- [x] Sponsorship limits (configurable per-user cap)

### Transaction Flow
- [x] Gas strategy decision (paymaster → native)
- [x] Gas quoting
- [x] Transaction recording
- [x] Remaining sponsorship tracking

### Edge Cases
- [x] Sponsor exhausted
- [x] Paymaster unavailable
- [ ] User requires POL (deferred — tested in Nimiq Pay env)
- [ ] Retry flow (deferred)

**Milestone:** ✅ Gas abstraction layer built. End-to-end validation requires Nimiq Pay environment.

---

## Phase 9: Production Polish (100%) ✅

### UX Polish
- [x] Empty states (goals, challenges, transactions, recurring)
- [x] Error states (transaction failures, connection errors)
- [x] Success feedback (goal completion banner)
- [x] Loading states (button spinners, query loading)
- [x] Responsive layouts (mobile-first, bottom nav)
- [ ] Loading skeletons (deferred)
- [ ] Pull-to-refresh (deferred)
- [ ] Haptic feedback (deferred — platform dependent)

### Performance
- [x] TanStack Query caching (auto refetch, stale management)
- [ ] Lazy loading (deferred — code-split at routes)
- [ ] Code splitting (deferred — chunk size warning present)
- [ ] Bundle optimization (deferred — viem is large)

### Security
- [x] Input validation (forms via react-hook-form + zod-ready)
- [x] Transaction validation (amount checks, balance checks)
- [ ] Error monitoring (deferred — Sentry or equivalent)
- [ ] Rate limiting (deferred — backend layer)

### Analytics
- [x] Analytics utility created
- [ ] Track deposits (deferred — integrate analytics calls)
- [ ] Track withdrawals (deferred)
- [ ] Track borrows (deferred)
- [ ] Track repayments (deferred)
- [ ] Track goal creation (deferred)
- [ ] Track challenge participation (deferred)

### Testing
- [x] Unit tests (Button component — 4 tests passing)
- [ ] Integration tests (deferred)
- [ ] Responsive testing (deferred)
- [ ] WebView testing (deferred — Nimiq Pay env)
- [ ] Polygon testnet validation (deferred — testnet access)
- [ ] Nimiq Pay validation (deferred — Nimiq Pay env)

**Milestone:** ✅ Foundation built. Production hardening items marked as deferred.
