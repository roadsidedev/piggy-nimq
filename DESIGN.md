---
name: Piggy
description: Friendly mobile-first savings and borrowing dApp — save smarter, borrow smarter, together
colors:
  primary: "#ff6f91"
  primary-deep: "#e14c74"
  primary-muted: "#ff8fa8"
  sage: "#c93e63"
  sage-deep: "#a82e50"
  sage-light: "#ffe8de"
  green-soft: "#2fd98a"
  green-deep: "#15803d"
  gold: "#f4b740"
  gold-deep: "#d9932a"
  mint: "#d1fae5"
  navy: "#252749"
  navy-deep: "#101124"
  ink: "#17182B"
  surface: "#ffffff"
  surface-warm: "#fff6f3"
  surface-sand: "#ffe8de"
  border: "#e5e7eb"
  text-primary: "#17182B"
  text-secondary: "#6b7280"
  text-muted: "#9ca3af"
  error: "#ef4444"
  error-light: "#fef2f2"
typography:
  display:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.sage}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.sage-deep}"
  button-secondary:
    backgroundColor: "#f3f4f6"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  card-hero:
    backgroundColor: "linear-gradient(135deg, {colors.surface-warm}, {colors.surface-sand})"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Piggy

## 1. Overview

**Creative North Star: "The Savings Garden"**

Piggy's design system grows from the idea of a savings garden — a place where money takes root, grows, and bears fruit. Every screen should feel nurturing and alive, like watching your savings grow in real time. The palette is warm and coral-forward, anchored by a friendly pink that feels distinctly Piggy without crossing into childish territory. Fredoka carries the headings with its rounded, approachable letterforms, while Manrope keeps body text clean and legible on mobile. The system rejects cold fintech sterility and generic DeFi complexity — Piggy is a financial friend, not a bank terminal.

The density is mobile-first and breathing room is generous. Cards are soft and rounded, modals slide up from the bottom like a conversation, and every interaction has a tactile, playful quality. The garden metaphor extends to motion: growth animations, gentle easing, progressive disclosure that unfolds like a plant opening toward light. Nothing jarring, nothing mechanical.

**Key Characteristics:**
- Warm coral-pink primary that reads as distinctly Piggy
- Generous spacing and soft rounded shapes for a mobile-first, touch-friendly experience
- Playful micro-interactions that celebrate savings milestones
- Clear financial data presentation without cold fintech sterility
- Bottom-sheet modals and mobile-native patterns throughout

## 2. Colors

The palette is coral-pink-forward with warm supporting tones — a garden in perpetual bloom.

### Primary
- **Coral Pink** (#ff6f91): The heart of Piggy. Used for primary CTAs, active states, key interactive elements. Warm, playful, unmistakable.
- **Deep Rose** (#e14c74): The primary's confident sibling. Used for hover states, active press, and high-emphasis accents.
- **Blush** (#ff8fa8): The primary's lightest expression. Used for soft backgrounds, tag fills, and tinted surfaces.

### Secondary
- **Sage Rose** (#c93e63): The secondary anchor. Used for the vault balance card gradient, yield active states, and structural emphasis. Deeper and more grounded than the primary.
- **Sage Deep** (#a82e50): Darker variant for hover states and high-contrast text on light surfaces.

### Tertiary
- **Mint Green** (#2fd98a): The growth color. Used for positive indicators — yield earnings, health factor good, goal progress, success states.
- **Gold** (#f4b740): The reward color. Used for streaks, challenge highlights, achievement badges, and celebratory moments.
- **Navy** (#252749): The grounding neutral. Used for dark mode toggles, disabled states, and structural depth.

### Neutral
- **Ink** (#17182B): Primary text color. Deep but not pure black — warm enough to feel approachable.
- **White** (#ffffff): Card surfaces, modal backgrounds, input fields.
- **Warm Surface** (#fff6f3): The warm-tinted base that gives Piggy its garden warmth. Used for the body gradient start.
- **Sand** (#ffe8de): The gradient midpoint. Tinted toward the primary's hue without being overtly pink.
- **Border Gray** (#e5e7eb): Subtle structural dividers and card borders.
- **Text Secondary** (#6b7280): Supporting text, labels, descriptions.
- **Text Muted** (#9ca3af): Placeholders, timestamps, tertiary info.

### Named Rules
**The Garden Rule.** Every color in Piggy's palette has warmth. Even the greens lean toward mint, not forest. Cold blues, sterile grays, and clinical whites are forbidden — the garden is always in bloom.

**The Coral Anchor Rule.** The coral pink (#ff6f91) appears on ≤15% of any given screen. Its rarity makes it meaningful — every pink element signals "this is important, this is interactive."

## 3. Typography

**Display Font:** Fredoka (with system-ui fallback)
**Body Font:** Manrope (with system-ui fallback)
**Mono Font:** JetBrains Mono (with ui-monospace fallback)

**Character:** Fredoka's rounded terminals and soft geometry give Piggy its friendly, approachable face — like a well-designed toy that happens to be a financial tool. Manrope is the grounded counterpart: clean, modern, and highly legible at small sizes on mobile screens.

### Hierarchy
- **Display** (600 weight, clamp(2rem, 5vw, 3rem), 1.2 line-height): Hero headlines — vault balance, page titles. Used sparingly for maximum impact.
- **Headline** (600 weight, 1.5rem, 1.3 line-height): Section headers — "Your Vault", "Savings Goals", "Active Challenges".
- **Title** (600 weight, 1.125rem, 1.4 line-height): Card titles, modal headers, feature names.
- **Body** (400 weight, 0.9375rem, 1.6 line-height): All running text, descriptions, explanatory copy. Max line length: 65ch.
- **Label** (500 weight, 0.875rem, 1.4 line-height): Form labels, button text, navigation items, tab labels.
- **Mono** (400 weight, 0.8125rem): Transaction hashes, addresses, numerical data that needs to align.

### Named Rules
**The Fredoka Reserve Rule.** Fredoka is reserved for headlines and display text. Using it for body copy or labels dilutes its impact and makes the interface feel juvenile. Body text is always Manrope.

## 4. Elevation

Piggy uses a hybrid approach: soft ambient shadows for depth and warm gradients for atmosphere. The vault balance card is the signature — a pink-to-sand gradient that gives the hero element a garden-glow quality. Cards lift subtly with shadow-sm; modals rise with shadow-xl. Depth is conveyed through gradient and shadow together, never through hard borders alone.

### Shadow Vocabulary
- **Card ambient** (`box-shadow: 0 1px 3px rgba(0,0,0,0.08)`): Default card lift. Subtle, almost imperceptible — the card floats on the warm gradient.
- **Card hover** (`box-shadow: 0 4px 12px rgba(0,0,0,0.1)`): Interactive feedback. Cards that are clickable gain slightly more presence on hover.
- **Modal backdrop** (`box-shadow: 0 -4px 24px rgba(0,0,0,0.12)`): The bottom sheet rises with a soft upward shadow that separates it from the page.
- **Modal content** (`box-shadow: 0 8px 32px rgba(0,0,0,0.16)`): The modal panel itself — prominent but not heavy.

### Named Rules
**The Warm Shadow Rule.** All shadows use warm-tinted rgba values, never pure black. The garden is always bathed in warm light.

## 5. Components

### Buttons
- **Shape:** Gently rounded (12px radius) — confident but not aggressive.
- **Primary:** Sage rose (#c93e63) background, white text, 12px 24px padding. The workhorse CTA.
- **Hover / Focus:** Deepens to sage-deep (#a82e50) on hover. Focus ring uses the primary's hue at 30% opacity.
- **Secondary:** Light gray (#f3f4f6) background, secondary text. For less prominent actions.
- **Ghost:** Transparent background, secondary text. For navigation and tertiary actions.
- **Danger:** Red (#ef4444) background for destructive actions — withdraw, delete, disconnect.

### Cards
- **Corner Style:** Gently curved (16px radius) — the garden's soft edges.
- **Background:** White (#ffffff) for content cards. Warm gradient (pink-50 → sand-100) for the vault hero card.
- **Shadow Strategy:** Card ambient at rest, card hover on interactive cards.
- **Border:** 1px solid border-gray (#e5e7eb) — structural, not decorative.
- **Internal Padding:** 16px standard, 24px for hero/featured cards.

### Inputs
- **Style:** Clean white background, 1px border (border-gray), 8px radius. Text is ink-colored, placeholders are muted.
- **Focus:** Sage-300 focus ring (2px) with smooth transition. Border shifts to match.
- **Error:** Red border (#ef4444) with red helper text below.
- **Disabled:** Reduced opacity, no pointer events.

### Navigation
- **Style:** Bottom tab bar — mobile-native, always accessible. Five tabs: Dashboard, Vault, Borrow, Goals, Account.
- **Active:** Primary coral-pink indicator with filled icon.
- **Inactive:** Muted gray icon and label.
- **Typography:** Label weight (500), 0.75rem size for compact mobile tabs.

### Modals
- **Style:** Bottom sheet on mobile (slides up from bottom, rounded top corners), centered dialog on desktop.
- **Shape:** 24px top radius on mobile, full 24px radius on desktop.
- **Backdrop:** Dark overlay (black/60%) with click-to-dismiss.
- **Content:** White background, 24px padding, title + close button header.

### Toggle
- **Style:** Pill-shaped track (44px × 24px), circular thumb (20px).
- **Off:** Gray track (#d1d5db), white thumb.
- **On:** Mint green track (#2fd98a), white thumb. The growth color signals active yield.
- **Transition:** Smooth 200ms ease-out on thumb slide.

## 6. Do's and Don'ts

### Do:
- **Do** use the warm gradient (pink-50 → sand-100) as the body background — it's Piggy's signature warmth.
- **Do** celebrate milestones with gold (#f4b740) accents — streaks, goal completions, challenge wins.
- **Do** use mint green (#2fd98a) exclusively for positive growth indicators — yield earnings, health factor good, progress bars.
- **Do** keep Fredoka reserved for headlines and display text — it's the voice of Piggy, not the fine print.
- **Do** use bottom-sheet modals on mobile — they feel native and conversational.
- **Do** show financial data clearly with mono font alignment — numbers must be scannable.
- **Do** use progressive disclosure for complex flows (yield setup, borrow configuration) — reveal complexity as the user needs it.

### Don't:
- **Don't** use generic SaaS-cream backgrounds, gradient text, glassmorphism as default, hero-metric templates, identical card grids, or tiny uppercase eyebrows above every section.
- **Don't** use cold blues, sterile grays, or clinical whites — the garden is always warm.
- **Don't** use Fredoka for body copy or labels — it loses its impact and feels juvenile.
- **Don't** use pure black (#000000) for text — use ink (#17182B) which has warmth.
- **Don't** stack cards inside cards — one level of nesting maximum.
- **Don't** use border-left or border-right as colored accent stripes — use background tints or full borders instead.
- **Don't** gate content visibility on class-triggered transitions — always show a meaningful default state.
