# Handoff: MCP Demo Wrapper Restyle

## Overview
Restyles the non-MCP "wrapper" chrome of the MCP multi-surface demo (`app/page.tsx` in `devonsa-lab`) to match the brutalist visual system of the `devonsa` portfolio site. Adds an animated protocol timeline, a simulated latency/token/cost readout, simulated failure states, and a light/dark toggle. The two rendered MCP surfaces (`MerchantCenterCard`, `AdsBanner`) are untouched — they're deliberately styled opposite each other to prove the polymorphic-render point of the demo.

## About the Design Files
`MCP Demo Wrapper.dc.html` (included in this folder as `design-reference.html`) is a **design reference built in HTML** — it shows the intended look, states, and interactions, but it is not production code. The task is to recreate this in the existing Next.js/React/Tailwind v4 stack in `devonsa-lab`, using its own component patterns (`components/ui/*`, shadcn-style primitives) rather than copying the HTML/inline-style markup directly.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, and shadows below are final values — implement pixel-close, not just "in the spirit of."

## Screens / Views
One page, five stacked sections inside a centered `max-width: 880px` column, `56px` top padding, `28px` gap between sections.

**1. Header row** — flex row, `justify-content: space-between`.
- Left: pill badge, `2px solid` border (border color per theme), `border-radius: 80px`, `padding: 6px 14px`. Contains an 8px aqua dot (`#54cea1`) that pulses (opacity 1↔0.35, 1.6s ease-in-out infinite) + text "Model Context Protocol Demo" in IBM Plex Mono, 600, 0.68rem, uppercase, 0.06em letter-spacing.
- Right: theme toggle pill button, same border/radius treatment, label "Dark mode" / "Light mode" toggling `dark` state.

**2. Title block**
- H1: Plus Jakarta Sans 800, `clamp(2rem, 4vw, 2.75rem)`, letter-spacing -0.02em, line-height 1.1. Text: "One MCP tool call. **Two native renders.**" — the second sentence is colored `#0e84f1` (cyan-blue).
- Subtitle: Inter 400, 1rem, color = theme's secondary text, max-width 600px, margin-top 12px.

**3. Query & Presets card** (card chrome defined once, reused for every card — see Design Tokens)
- Section label "Query & Presets" — Plus Jakarta Sans 800, 0.95rem.
- Preset grid: `grid-template-columns: repeat(auto-fit, minmax(200px,1fr))`, gap 10px. 4 preset buttons, each a `border-radius: 14px` card: label (Plus Jakarta Sans 700, 0.85rem) + sub-label (IBM Plex Mono, 0.65rem, uppercase). Unselected: muted background, subtle border. Selected: filled with the preset's own accent color, white text.
  - Presets: "7-Day Price Trajectory" (cyan `#0e84f1`), "4-Brand Price Benchmark" (amethyst `#9461fb`), "Warehouse Buffer Gauge" (tangerine `#ff9254`), "Omnichannel GMV Split" (aqua `#54cea1`).
- Divider: 2px solid, subtle border color, `margin: 20px 0`.
- "Widget override" label (mono, uppercase, 0.7rem) + row of 5 pill toggle buttons (Auto / Trend line / Ranked bars / Progress gauge / Segment breakdown). Selected = filled with theme foreground color, inverse text.
- Query form: pill text input (flex-grow, `border-radius: 80px`, muted background) + "Execute MCP" pill button (filled with theme foreground, inverse text, IBM Plex Mono 600 uppercase).
- Divider, then "Simulate a failure" label + 3 outlined pink (`#ff5470`) pill chips: "429 rate limit", "Invalid schema", "Upstream timeout".

**4. Protocol Timeline card** (appears once a preset/query/error chip has been triggered)
- 4-node horizontal timeline, connected by 2px lines: "Query & widget intent" → "MCP tool call" → "Schema synthesis" → "Adaptive render". Each node is a 32px circle, IBM Plex Mono 600 0.8rem.
  - **pending**: muted bg, subtle border, shows step number.
  - **active**: theme bg, border + text in that step's color (`#54cea1`, `#0e84f1`, `#ff9254`, `#9461fb` in order), pulses (same pulse keyframe as the header dot).
  - **done**: filled with that step's color, white "✓".
  - **error**: filled `#ff5470`, white "!".
  - Connector line color = the passed step's color once both ends are done, otherwise the subtle border color.
- On failure: a rounded error box below the timeline (`2px solid #ff5470`, tinted background, tinted text) shows the failure message.
- On success: 3 stat chips ("Latency", "Tokens (in / out)", "Est. cost") — bordered `14px` boxes, mono label + Plus Jakarta Sans 800 value.

**5. Dual Native Surface Renders card + Wire protocol card** (appear once a run completes successfully)
- Two side-by-side bordered panels (`16px` radius) labeled "Surface A — Editorial" (cyan) and "Surface B — Constructivist" (tangerine), each with a striped placeholder block (`repeating-linear-gradient` at 135°, accent color at ~15% opacity, 10px stripes) captioned in mono type — **these stand in for the real `MerchantCenterCard`/`AdsBanner` components; don't restyle those components themselves.**
- Wire protocol: a toggle row ("Raw MCP wire protocol" + "+"/"−") that expands two code blocks (request / response), each `#0a0a0b` background regardless of light/dark mode, `2px solid #000`, `8px` radius, IBM Plex Mono 0.72rem/1.6, request text `#7dd3fc`, response text `#6ee7b7`.

## Interactions & Behavior
- Clicking a preset or "Execute MCP" starts a simulated 4-step run: step advances roughly every 430ms; on the final step, stats compute and the timeline marks step 4 done.
- Clicking a failure chip runs the same sequence but fails at step 3 ("Schema synthesis") with that scenario's error message; the run stops there — no stats, no surfaces/wire cards.
- Dark mode toggle flips all card/background/border/text colors instantly (see tokens below); code blocks stay dark in both modes.
- Wire protocol section is collapsed by default per run.

## State Management
- `dark: boolean`
- `query: string`, `visType: string`, `activePresetIdx: number | null`
- `loading: boolean`, `step: number` (-1 idle, 0-3 during run), `hasRun: boolean`, `done: boolean`
- `error: { message, atStep } | null`
- `stats: { latency, tokensIn, tokensOut, cost } | null`
- `showWire: boolean`

## Design Tokens

**Typography**
- Headings: Plus Jakarta Sans, 700/800
- Body: Inter, 400/500/600
- Labels/mono/code: IBM Plex Mono, 400/600

**Colors — accents** (shared with the portfolio's hero palette)
- Aqua-green `#54cea1`, Cyan-blue `#0e84f1`, Tangerine `#ff9254`, Amethyst `#9461fb`, Pink/error `#ff5470`

**Colors — light theme**
- bg `#ffffff`, fg `#000000`, text-secondary `#52525b`, border `#000000`, border-subtle `#e0e0e0`, muted-bg `#f4f4f5`, shadow-color `#e0e0e0`

**Colors — dark theme**
- bg `#0a0a0b`, fg `#f2f2f2`, text-secondary `#b4b4bd`, border `#ffffff`, border-subtle `rgba(255,255,255,0.25)`, muted-bg `rgba(255,255,255,0.06)`, shadow-color `#27272a`

**Structure**
- Card: 2px solid border, `border-radius: 20px`, `box-shadow: 4px 4px 0 <shadow-color>` (hard offset, no blur), padding 24px
- Pills (buttons/inputs/badges): `border-radius: 80px`
- Small structural elements (preset tiles, stat chips, surface panels): `border-radius: 14–16px`
- Code blocks: `border-radius: 8px` (sharper, per the portfolio's own convention of tighter radii inside bubbly outer cards)
- Divider: 2px solid border-subtle

## Ready-to-paste CSS additions
Add alongside the existing tokens in `app/globals.css` (keep the current shadcn tokens for any other routes; scope these under a class if this page needs to coexist with them):

```css
:root {
  --brand-bg: #ffffff;
  --brand-fg: #000000;
  --brand-text-secondary: #52525b;
  --brand-border: #000000;
  --brand-border-subtle: #e0e0e0;
  --brand-muted-bg: #f4f4f5;
  --brand-shadow-color: #e0e0e0;
  --brand-aqua: #54cea1;
  --brand-cyan: #0e84f1;
  --brand-tangerine: #ff9254;
  --brand-amethyst: #9461fb;
  --brand-pink: #ff5470;
  --brand-card-radius: 20px;
  --brand-pill-radius: 80px;
}
.dark {
  --brand-bg: #0a0a0b;
  --brand-fg: #f2f2f2;
  --brand-text-secondary: #b4b4bd;
  --brand-border: #ffffff;
  --brand-border-subtle: rgba(255,255,255,0.25);
  --brand-muted-bg: rgba(255,255,255,0.06);
  --brand-shadow-color: #27272a;
}
@keyframes brand-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
```

You'll need to add the three fonts via `next/font/google` in `app/layout.tsx` (Plus Jakarta Sans 700/800, Inter 400/500/600, IBM Plex Mono 400/600) and expose them as CSS variables the same way the current `--font-sans` is wired up.

## Assets
No image assets — the "surface" placeholders use CSS `repeating-linear-gradient` stripes, no icon library.

## Files
- `design-reference.html` — the interactive HTML prototype (source of truth for exact values/behavior)
