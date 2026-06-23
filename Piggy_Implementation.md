# Piggy v1 Implementation Roadmap (0 → 100%)

This roadmap breaks development into logical phases, ensuring the highest technical risks are addressed first while continuously delivering a functional product. By the end of each phase, the application should remain usable and progressively closer to production readiness.

---

# Phase 0: Project Foundation (5%)

## Goal

Establish the development environment, architecture, and UI foundation before building product features.

## Deliverables

### Repository Setup

- Initialize repository
- Configure TypeScript
- ESLint
- Prettier
- Husky
- GitHub Actions (CI)

### Core Stack

- React
- Vite (or Next.js if required by Mini Apps)
- Tailwind CSS
- TanStack Query
- Zustand
- React Hook Form
- Zod
- viem

### Project Structure

```text
src/
├── components/
├── pages/
├── hooks/
├── services/
├── integrations/
│   ├── nimiq/
│   ├── aave/
│   └── paymaster/
├── stores/
├── types/
├── utils/
└── assets/
```

### UI Foundation

- Design system
- Typography
- Color palette
- Mobile-first layout
- Bottom navigation
- Global theme
- Reusable button, card, modal, and input components

**Milestone**

The project builds successfully with a clean architecture and reusable UI components.

---

# Phase 1: Nimiq Mini App Integration (15%)

## Goal

Successfully run Piggy inside Nimiq Pay.

## Features

- Integrate Nimiq Mini App SDK
- Detect wallet
- Load user profile
- Access Nimiq provider
- Access Ethereum provider
- Validate Polygon network
- Handle provider events

## Wallet Service

```ts
WalletService

connect()

disconnect()

getProfile()

getAddress()

switchChain()
```

## Validation

- Wallet connects
- User profile loads
- Message signing works
- Test transaction succeeds
- Network switching behaves correctly

**Milestone**

Piggy successfully runs inside Nimiq Pay with authenticated users.

---

# Phase 2: Aave Integration (30%)

## Goal

Complete the core DeFi integration.

This is the highest technical risk and should be completed before building product features.

## Build

Create a reusable `AaveService`.

### Supported Operations

- Deposit
- Withdraw
- Supply
- Borrow
- Repay
- Health Factor
- Live APY
- Available Borrow
- Reserve Data

## Deliverables

- Polygon integration
- USDC balance retrieval
- Supply assets
- Withdraw assets
- Borrow against collateral
- Repay loans
- Health factor calculation
- Interest calculations

**Milestone**

A complete savings and borrowing pipeline works on Polygon testnet.

---

# Phase 3: Vault MVP (45%)

## Goal

Deliver the first usable savings product.

## Features

### Vault Screen

- Current balance
- Deposit
- Withdraw
- Yield toggle
- Vault age
- Transaction history

### Components

- Vault Card
- Balance Card
- Deposit Modal
- Withdraw Modal
- Yield Toggle
- Transaction History

### State

- Vault balance
- Yield status
- APY
- Earnings

**Milestone**

Users can successfully save funds, withdraw funds, and enable yield.

---

# Phase 4: Borrow Module (60%)

## Goal

Allow users to borrow against their savings.

## Dashboard

Display

- Available borrow
- Borrowed amount
- Health factor
- Liquidation threshold

## Borrow Flow

- Enter amount
- Preview loan
- Confirm
- Execute

## Repayment

- Partial repayment
- Full repayment

## Risk Simulator

```
Borrow Amount

↓

Estimated Health Factor

↓

Risk Level
```

## Additional Features

- Liquidation warnings
- Risk indicators
- Educational tooltips

**Milestone**

Users can borrow and repay while understanding liquidation risk.

---

# Phase 5: Goals System (70%)

## Goal

Allow users to save toward multiple financial goals.

## Features

- Create goals
- Edit goals
- Delete goals
- Allocate funds
- Transfer funds between goals
- Track progress

## Goal Model

```ts
Goal

id

title

targetAmount

currentAmount

targetDate

createdAt
```

## UI

- Goal Cards
- Progress Bar
- Progress Ring
- Celebration animations

**Milestone**

Users can organize savings into multiple targeted vaults.

---

# Phase 6: Recurring Savings (78%)

## Goal

Automate savings.

## Features

- Weekly schedules
- Monthly schedules
- Pause schedule
- Resume schedule
- Edit schedule
- Delete schedule

## Dashboard

- Upcoming deposits
- Deposit history
- Missed deposits

## Enhancements

- Reminder banners
- Automatic goal allocation

**Milestone**

Users can automate recurring savings.

---

# Phase 7: Save with Frens (88%)

## Goal

Introduce social savings.

## Public Challenges

- Browse
- Search
- Join
- Leave

## Private Challenges

- Create
- Invite friends
- Share links

## Challenge Model

```ts
Challenge

Owner

Members

Target

Frequency

Duration

Leaderboard

Streak
```

## Leaderboards

- Highest savings
- Longest streak
- Current streak

## Social Features

- Invite friends
- Share progress
- Share achievements

**Milestone**

Users can participate in social savings challenges.

---

# Phase 8: Gas & Account Abstraction (93%)

## Goal

Deliver a frictionless transaction experience.

## Implement

- Native Nimiq gas abstraction
- ERC-4337 Paymaster integration
- Sponsorship logic
- Fallback handling
- Sponsorship limits

## Transaction Flow

```
User Action

↓

Wallet

↓

Gas Strategy

↓

Sponsor?

↓

Transaction

↓

Confirmation

↓

Refresh State
```

## Edge Cases

- Sponsor exhausted
- Paymaster unavailable
- User requires POL
- Retry flow

**Milestone**

Users complete every transaction without worrying about gas whenever sponsorship is available.

---

# Phase 9: Production Polish (100%)

## Goal

Prepare Piggy for launch.

## User Experience

- Loading skeletons
- Empty states
- Success screens
- Error states
- Animations
- Pull-to-refresh
- Responsive layouts
- Improved spacing
- Haptic feedback (if supported)

## Performance

- Lazy loading
- Code splitting
- Query caching
- Bundle optimization

## Security

- Input validation
- Transaction validation
- Error monitoring
- Rate limiting

## Analytics

Track

- Deposits
- Withdrawals
- Borrows
- Repayments
- Goal creation
- Challenge participation
- Retention
- Conversion funnel

## Testing

- Unit tests
- Integration tests
- Responsive testing
- WebView testing
- Polygon testnet validation
- Nimiq Pay validation

**Milestone**

Piggy is production-ready.

---

# Suggested Folder Structure

```text
src/
├── app/
├── assets/
├── components/
│   ├── common/
│   ├── vault/
│   ├── borrow/
│   ├── goals/
│   ├── challenges/
│   └── profile/
├── features/
│   ├── vault/
│   ├── borrow/
│   ├── goals/
│   ├── recurring/
│   └── challenges/
├── hooks/
├── integrations/
│   ├── nimiq/
│   ├── aave/
│   ├── paymaster/
│   └── wallet/
├── services/
├── stores/
├── types/
├── utils/
└── pages/
```

---

# Critical Milestones

| Milestone | Objective | Risk Addressed |
|------------|-----------|----------------|
| M1 | Mini App runs inside Nimiq Pay | Platform compatibility |
| M2 | Wallet and profile integration | Identity and authentication |
| M3 | Aave deposit and withdrawal | Core DeFi integration |
| M4 | Borrow and repay | Lending functionality |
| M5 | Gas sponsorship | User onboarding friction |
| M6 | Complete savings journey without requiring POL | Core product promise |
| M7 | Goals, recurring savings, and challenges | User engagement |
| M8 | Production validation | Launch readiness |

---

# Recommended Development Order

Rather than building each navigation tab independently, development should follow the order of technical dependencies and project risk.

1. **Infrastructure & UI Foundation**
   - Project setup
   - Design system
   - Routing
   - State management

2. **Nimiq Mini App Integration**
   - Wallet connection
   - User identity
   - Provider validation

3. **Aave Core Integration**
   - Deposit
   - Withdraw
   - Borrow
   - Repay
   - Health factor
   - APY

4. **Vault Experience**
   - Savings
   - Yield toggle
   - Transaction history

5. **Borrow Experience**
   - Borrowing
   - Repayment
   - Risk simulator
   - Liquidation warnings

6. **Goals & Recurring Savings**
   - Goal management
   - Scheduled deposits

7. **Save with Frens**
   - Challenges
   - Streaks
   - Leaderboards
   - Invitations

8. **Gas & Account Abstraction**
   - Paymaster
   - Sponsorship
   - Fallback handling

9. **Production Polish**
   - Testing
   - Analytics
   - Optimization
   - Accessibility
   - Launch preparation

---

# End Goal

By the end of this roadmap, Piggy will deliver a complete mobile-first savings experience inside Nimiq Pay, enabling users to:

- Save USDC securely
- Earn optional yield through Aave
- Borrow against their savings
- Create multiple financial goals
- Automate recurring deposits
- Participate in social savings challenges
- Complete every core interaction with minimal gas friction
- Enjoy a polished, production-ready experience built for long-term growth