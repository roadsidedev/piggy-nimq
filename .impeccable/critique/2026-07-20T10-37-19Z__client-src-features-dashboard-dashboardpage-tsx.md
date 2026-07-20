---
target: dashboard
total_score: 18
p0_count: 2
p1_count: 2
p2_count: 1
timestamp: 2026-07-20T10-37-19Z
slug: client-src-features-dashboard-dashboardpage-tsx
---
## Piggy Dashboard Critique

### Report Header
Method: dual-agent (A: design-review · B: detector-scan)

### Anti-Patterns Verdict

**Does it look AI-generated?**

**LLM Assessment:** The dashboard avoids the classic AI tells — no gradient text, no glassmorphism, no uppercase eyebrows, no numbered sections. But it fails the deeper test: the **"safe middle" trap**. Every component does its job and nothing more. No personality, no surprise, no moment where a human designer clearly had an opinion. The most damning signal: Fredoka and Manrope are loaded and tokenized but **zero dashboard components use them**. The brand's most distinctive visual asset is absent from the primary screen.

**Deterministic scan:** Zero automated findings. The detector found no code-level violations. But the manual scan surfaced: 4 contrast issues (gray-400 on white fails WCAG AA), 4 buttons missing focus-visible styles, 7 decorative icons missing aria-hidden, and 3 potential text overflow risks at mobile widths.

**Visual overlays:** Not attempted (browser automation not available in this session).

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Loading skeleton solid, but no success/failure feedback after yield toggle. Errors silently caught. |
| 2 | Match System / Real World | 3 | DeFi terms appropriate for audience. "Health Factor" needs explanation for newcomers. |
| 3 | User Control and Freedom | 2 | No undo, no confirmation before on-chain tx, no way to hide sections. |
| 4 | Consistency and Standards | 2 | VaultBalanceCard uses rounded-3xl vs rounded-2xl everywhere else. Toggle color doesn't match DESIGN.md mint. |
| 5 | Error Prevention | 1 | No confirmation before yield toggle. No liquidation risk warning. Health factor danger without guidance. |
| 6 | Recognition Rather Than Recall | 2 | QuickActions well-labeled. No thumbnails for goals. No "what happens next" hints. |
| 7 | Flexibility and Efficiency | 1 | No pull-to-refresh. No shortcuts. No customization. Power user gets same view as casual user. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean layout, no clutter. But 5 full-width cards = heavy scrolling. |
| 9 | Error Recovery | 1 | Silent catch blocks. No error state UI. No retry. No "something went wrong" message anywhere. |
| 10 | Help and Documentation | 1 | No tooltips, no onboarding, no contextual help. "Health Factor 1.5" means nothing to newcomers. |
| **Total** | | **18/40** | **Poor — major UX overhaul required** |

### What's Working

1. **VaultBalanceCard has real brand character.** The PiggyBank illustration, warm gradient, and clean balance presentation create a genuine "this is Piggy" moment. It's the only component that feels designed rather than assembled.

2. **LoadingSkeleton mirrors the actual layout.** Hero card, 2-col grid, action bar, list items — users get accurate spatial preloading. Small detail done right.

3. **QuickActions is well-structured for the constraint.** 4 actions, right icons, appropriate touch targets, tactile press state. The right 4 for a savings dashboard.

### Priority Issues

**P0 — Font system is dead.** Fredoka and Manrope are loaded, tokenized, and documented, but zero dashboard components use them. All text renders in system fonts. The brand's most distinctive visual asset is absent from the primary screen. This is both a design system violation and an AI slop signal — the components were generated without reading the theme config. Fix: add font-heading and font-body classes to all text elements. 15-minute fix that transforms the entire feel.

**P0 — Health factor color logic is inverted.** BorrowedCard.tsx:44 maps higher health factor (safer) to deeper rose (danger) and lower health factor (danger) to light pink (safe). In Aave, health factor >2 is safe, <1.5 is liquidation risk. The color mapping is backwards — a financial safety issue. Fix: invert to mint for safe, gold for caution, red for danger.

**P1 — Zero celebration after rewarding actions.** Starting to earn yield is the single most rewarding action in the app. The dashboard shows... the same view with a slightly different toggle state. No feedback, no visual shift, no "Yield activated!" moment. PRODUCT.md says "Rewarding every tap." Fix: add celebration animation + toast on yield activation, transition YieldCard to mint tint.

**P1 — Zero-state dead ends.** "No active goals" and "No active challenges" are dead-end text with no CTA, no illustration, no emotional framing. For a product positioning as "Social by nature," showing "No active challenges" without an invitation is a conversion failure. Fix: replace with illustrated empty states + CTA that links to creation.

**P2 — No error state UI anywhere.** Silent catch blocks. No card has an error state. If vault position query fails, the loading skeleton just disappears. In a financial app, silent failures erode trust. Fix: add error boundaries per card with retry buttons. Label estimates as "Estimated."

### Persona Red Flags

**Alex (Power User):** No customization. Can't rearrange dashboard sections. No portfolio view (total position, P&L, historical yield). No transaction history. Hardcoded 0.75 liquidation threshold that doesn't match Aave's actual UI.

**Jordan (First-Timer):** "Health Factor 1.5" is meaningless without explanation. "Yield" is jargon — no tooltip, no "what is yield?" link. 5-card stack on first load with no guided path. "USDT" label assumes knowledge.

**Casey (Mobile User):** 4-col action grid is ~80px per button on 375px screen — tight. No pull-to-refresh. Bottom nav may overlap last card on shorter phones. PiggyBank animation loops continuously creating visual noise.

### Minor Observations

- Rounded-3xl vs rounded-2xl inconsistency between VaultBalanceCard and other cards
- YieldCard earnings copy repeats the APY that's already displayed above
- BorrowedCard shows "" when no debt — noise, consider hiding
- earnin gsToday prop receives monthlyEarnings (prop name lies)
- ChallengesPreview only shows one challenge regardless of how many exist
- overscroll-behavior: none prevents rubber-banding iOS users expect

### Questions to Consider

1. If you removed the PiggyBank illustration, would anything else on this screen tell you this is Piggy and not a generic savings app?
2. Why does a savings app's dashboard show "Borrowed" as the second-most prominent element? Should borrowing be secondary?
3. If "Social by nature" is a core principle, why is challenges at the very bottom of the scroll?
4. Is "Health Factor" the right concept for all users, or should it show "Safety Level: Safe/Caution/Danger" with the number available on tap?
5. What would happen if you collapsed Yield + Borrow into a single "Position Summary" card?
6. Why is there no "Total Value" number synthesizing vault + yield - borrow?
7. If a user opens Piggy for the first time with , what emotional state should they be in after 5 seconds?
