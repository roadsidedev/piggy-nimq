# Growth Hub UI Refinement Plan

## Context
The Growth page (`features/growth/GrowthPage.tsx`) already implements all requested features: dashboard summary card with SavingsTree, segmented Goals/Challenges control, search + Popular Challenges, and FAB action sheet. However, several shared components (Button, Card, Input) still carry dark-theme defaults that GrowthPage overrides inline, and the individual cards/sections could benefit from visual polish to better match the "Piggy" sage-green branding.

## Goal
Polish the Growth hub's visual design for a more cohesive, premium feel — consistent sage-green theming, richer micro-interactions, and better information hierarchy.

---

## Changes

### 1. Upgrade Goal Cards — `features/growth/GrowthPage.tsx` (GoalCard)
- Add a **percentage badge** (top-right) showing completion %
- Add a subtle **gradient progress bar** (sage-400 → sage-600) instead of flat sage-500
- Add a **confetti/sparkle animation** on the completed goal banner
- Show **"X days remaining"** when targetDate is set and in the future

### 2. Upgrade Challenge Cards — `features/growth/GrowthPage.tsx` (ChallengeCard)
- Add a **FlameIcon** next to the streak count with an orange-500 accent badge
- Style the leaderboard **rank numbers** with gold/silver/bronze colors for #1/#2/#3
- Add a **progress bar** per member showing their progress toward the challenge target
- Make Join/Leave buttons use sage-500 pill style (consistent with FAB)

### 3. Dashboard Summary Card Polish — `features/growth/GrowthPage.tsx`
- Add a **subtle sage gradient** background (`bg-gradient-to-br from-sage-50 to-white`) instead of plain white
- Add a **soft shadow ring** (`ring-1 ring-sage-100`) for depth
- Improve the metrics strip: use colored icons (GoalIcon, TrophyIcon, FlameIcon) next to each metric

### 4. Segmented Control Animation — `features/growth/GrowthPage.tsx`
- Add an **animated sliding indicator** (a `bg-sage-500` pill that slides behind the active tab) using CSS transitions
- Replace emoji icons (🎯/🏆) with the existing SVG GoalIcon and TrophyIcon from Icons.tsx

### 5. Popular Challenges Section Polish — `features/growth/GrowthPage.tsx` (ChallengesTab)
- Add **avatar stack** (overlapping Avatar circles) showing member count visually
- Add a subtle **"trending" pulse animation** on the SparkleIcon
- Style member count + streak as colored badges

### 6. FAB Enhancement — `features/growth/GrowthPage.tsx` (FAB)
- Add a **subtle pulse/glow ring animation** to draw attention
- Add a **rotate-scale transition** on open (FAB rotates 45° to become an "X")

### 7. Action Sheet Polish — `features/growth/GrowthPage.tsx` (ActionSheet)
- Add **hover scale effect** on each option card
- Use sage-500/sage-600 icon backgrounds consistently (already done, verify)
- Add a subtle **backdrop blur** on the overlay

### 8. Empty State Improvements — `features/growth/GrowthPage.tsx`
- Goals empty state: show a mini SavingsTree at "Seed" stage as visual hint
- Challenges empty state: show a mini trophy illustration

---

## Files to Modify
1. `client/src/features/growth/GrowthPage.tsx` — All card, dashboard, FAB, action sheet, segmented control, and empty state refinements

## Files NOT Modified
- `SavingsTree.tsx` — Already well-implemented with 5 stages
- `useGoals.ts`, `useChallenges.ts` — Data hooks are fine
- `stores/` — No data model changes needed
- `App.tsx` — Navigation structure is correct

## Verification
1. Run `npm run dev:client` to start the dev server
2. Navigate to the Growth tab
3. Verify: dashboard card has sage gradient, SavingsTree renders, metrics strip has icons
4. Verify: segmented control has animated indicator
5. Verify: Goal cards show percentage badges, progress bars animate
6. Verify: Challenge cards show flame streak badge, colored leaderboard ranks
7. Verify: Popular Challenges shows avatar stack
8. Verify: FAB has pulse glow, action sheet has backdrop blur
9. Verify: Empty states show visual illustrations
10. Run `npm run lint --workspace=@piggy/client` to check for lint errors
