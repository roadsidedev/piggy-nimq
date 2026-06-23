# Piggy 🐷

**Save smarter. Borrow smarter. Together.**

Piggy is a mobile-first savings and borrowing dApp that runs inside [Nimiq Pay](https://nimiq.com) as a Mini App. It helps users save stablecoins (USDC), earn optional yield through Aave V3 on Polygon, borrow against their savings, hit personal savings goals, and participate in social savings challenges.

Built for the Nimiq Mini Apps ecosystem — users never leave Nimiq Pay to manage their savings.

---

## Features

- **Vault** — Deposit and withdraw USDC, toggle Aave V3 yield with live APY tracking, view transaction history
- **Borrow** — Borrow against your vault collateral, repay loans, monitor health factor with a built-in risk simulator
- **Goals** — Create multiple targeted savings goals with progress tracking
- **Challenges** — Join or create social savings challenges with leaderboards and streak tracking
- **Recurring Savings** — Set up weekly or monthly automated deposits
- **Dashboard** — Unified view of vault balance, yield earnings, loan status, goals, and challenges
- **Gas Sponsorship** — ERC-4337 paymaster integration for sponsor-friendly transactions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19, TypeScript 6 |
| Build | Vite 8, Tailwind CSS 4 |
| State (client) | Zustand 5 |
| State (server) | TanStack React Query 5 |
| Web3 | viem 2 |
| Yield/Borrow | Aave V3 (Polygon) |
| Wallet | Nimiq Mini App SDK |
| Forms | react-hook-form 7 + Zod 4 |
| Linting | ESLint 10, Prettier 3 |
| Testing | Vitest 4, Testing Library |
| Git Hooks | Husky + lint-staged |

---

## Architecture

```
User → App (tab navigator) → Feature Pages (Vault, Borrow, Goals, Challenges, Account)
                                ↕ hooks (useVault, useBorrow, etc.)
                          Zustand stores (walletStore, vaultStore, etc.)
                                ↕
                          React Query (chain data)
                                ↕
                          Integrations (AaveService, WalletService, PaymasterService)
                                ↕
                          EVM Provider (Nimiq Pay / window.ethereum) + Polygon RPC
```

Data flows in one direction. Integration modules (Aave, Nimiq, Paymaster) are fully decoupled from UI components. Each feature module owns its hook, components, and local logic.

### Folder Structure

```
src/
├── components/         Reusable UI components
│   ├── common/         Button, Card, Modal, Input, icons
│   ├── vault/          Vault-related components
│   ├── account/        Account/profile components
│   └── dashboard/      Dashboard cards
├── features/           Feature modules
│   ├── vault/          Savings vault logic (useVault, VaultPage)
│   ├── borrow/         Borrow & repay logic (useBorrow, RiskSimulator)
│   ├── goals/          Goal management
│   ├── recurring/      Recurring savings
│   ├── challenges/     Social challenges
│   ├── dashboard/      Home dashboard
│   └── account/        Profile / settings
├── hooks/              Shared React hooks (useWallet, useNavigate)
├── integrations/       External service wrappers
│   ├── nimiq/          Nimiq Mini App SDK
│   ├── aave/           Aave V3 Polygon (AaveService, constants, client)
│   ├── paymaster/      Gas sponsorship service
│   └── wallet/         EIP-1193 provider abstraction
├── stores/             Zustand stores (wallet, vault, borrow, goals, challenges, recurring)
├── types/              TypeScript type definitions
├── utils/              Pure utility functions (analytics, formatting)
├── __tests__/          Test files
├── config/             Environment configuration
└── assets/             Static assets
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A wallet inside [Nimiq Pay](https://nimiq.com) (for development)

### Installation

```bash
git clone <repo-url>
cd piggy
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Required: Paymaster endpoint for gas sponsorship
VITE_PAYMASTER_URL=
VITE_PAYMASTER_API_KEY=

# Optional: Polygon RPC endpoints (defaults to public)
VITE_POLYGON_RPC_URL=
VITE_POLYGON_AMOY_RPC_URL=

# Testnet mode (true = Amoy, false = Polygon mainnet)
VITE_USE_TESTNET=true
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. The app works best when opened inside Nimiq Pay's Mini App browser for full wallet integration.

### Build

```bash
npm run build
```

Outputs production build to `dist/`.

### Preview

```bash
npm run preview
```

### Test

```bash
npm test
npm run test:watch
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |

---

## Key Integrations

### Nimiq Mini App SDK

Piggy uses the Nimiq Mini App SDK for wallet connection and identity. Nimiq Pay injects both a Nimiq provider and an Ethereum/EVM provider — the EVM provider is used for all Polygon-side contract calls (Aave). All transactions are signed within Nimiq Pay's native confirmation dialogs.

### Aave V3 (Polygon)

All yield and borrowing operations go through Aave V3 on Polygon. The `AaveService` wraps all interactions:

- `getReserveData()` — Live APY and reserve info
- `getUserAccountData()` — Collateral, debt, health factor
- `supply()` / `withdraw()` — Deposit yield
- `borrow()` / `repay()` — Borrow against vault
- `getDecimals()` — On-chain USDC decimals

### Paymaster (ERC-4337)

The `PaymasterService` handles gas sponsorship:

- Query gas strategy based on user's sponsorship count
- Request sponsorship quotes
- Submit sponsor transactions
- Fall back to native gas when sponsorship is exhausted

---

## Development Guidelines

See [`AGENT.md`](./AGENT.md) for full development conventions. The project follows three core principles:

1. **Clean Code** — intention-revealing names, small functions, no comments on bad code
2. **TDD** — no production code without a failing test first (RED-GREEN-REFACTOR)
3. **First-Principles** — build from scratch before reaching for a library

---

## Implementation Roadmap

| Phase | Status | Description |
|---|---|---|
| Phase 0: Foundation | Complete | Project setup, TypeScript, ESLint, Prettier, UI components |
| Phase 1: Nimiq Integration | Complete | Mini App SDK, wallet connection, provider events |
| Phase 2: Aave Integration | Complete | Deposit, withdraw, borrow, repay, health factor, APY |
| Phase 3: Vault MVP | Complete | Balance, deposit/withdraw modals, yield toggle, transaction history |
| Phase 4: Borrow Module | Complete | Borrow flow, repayment, risk simulator, health tracking |
| Phase 5: Goals System | Complete | Create/edit/delete goals, allocate funds, progress tracking |
| Phase 6: Recurring Savings | Complete | Weekly/monthly schedules, pause/resume |
| Phase 7: Save with Frens | Complete | Challenges, leaderboards, streaks |
| Phase 8: Gas & AA | Complete | Paymaster integration, sponsorship logic |
| Phase 9: Production Polish | In Progress | Testing, analytics, optimization, accessibility |

---

## Production Readiness

Current status: **D+** — Functional but gaps remain. See the [Production Audit Report](#) for the full breakdown.

### Known Areas for Improvement

- **Testing coverage** — currently ~21 tests across stores + components. Target: 80%+ coverage
- **Error monitoring** — basic `/api/log` endpoint logging in place; Sentry integration recommended
- **Environment validation** — startup crash on missing env vars; `.env.example` documents all required vars
- **Loading states** — dashboard has loading skeleton; other pages should follow
- **Accessibility** — Modal has focus trapping + ARIA attributes; remaining components need audit

---

## License

MIT
