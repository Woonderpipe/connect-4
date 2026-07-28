---
version: alpha
name: Connect 4 Arcade Minimal
description: A high-contrast, tactile game interface for a responsive Connect 4 web app with light/dark themes, animated controls, and localized LTR/RTL layouts.
colors:
  primary: "#18181b"
  on-primary: "#ffffff"
  primary-dark: "#f4f4f5"
  on-primary-dark: "#18181b"
  surface: "#ffffff"
  surface-muted: "#f4f4f5"
  surface-dark: "#18181b"
  surface-dark-muted: "#09090b"
  border: "#e4e4e7"
  border-dark: "#27272a"
  text: "#18181b"
  text-muted: "#52525b"
  text-dark: "#ffffff"
  text-dark-muted: "#71717a"
  player-red: "#ef4444"
  player-yellow: "#fbbf24"
  player-ocean: "#06b6d4"
  player-ocean-pair: "#10b981"
  player-sunset: "#f97316"
  player-sunset-pair: "#6366f1"
  success: "#22c55e"
  warning: "#f59e0b"
  danger: "#ef4444"
  overlay: "rgb(0 0 0 / 0.4)"
typography:
  display:
    fontFamily: system-ui
    fontSize: 3rem
    fontWeight: 900
    lineHeight: "1"
    letterSpacing: "0"
  heading:
    fontFamily: system-ui
    fontSize: 1.875rem
    fontWeight: 900
    lineHeight: "1.2"
    letterSpacing: "0"
  body:
    fontFamily: system-ui
    fontSize: 0.875rem
    fontWeight: 700
    lineHeight: "1.4"
    letterSpacing: "0"
  label-caps:
    fontFamily: system-ui
    fontSize: 0.6875rem
    fontWeight: 700
    lineHeight: "1.2"
    letterSpacing: "0.12em"
  timer:
    fontFamily: ui-monospace
    fontSize: 0.875rem
    fontWeight: 700
    lineHeight: "1.25"
    letterSpacing: "0"
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  modal: 32px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  page-x: 24px
  section-gap: 32px
components:
  page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  page-dark:
    backgroundColor: "{colors.surface-dark-muted}"
    textColor: "{colors.text-dark}"
  board:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 16px
  board-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.lg}"
    padding: 16px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    height: 56px
  button-primary-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    height: 56px
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.lg}"
    height: 48px
    width: 48px
  segmented-control:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: 4px
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.modal}"
    padding: 32px
---

## Overview

The visual identity is a compact, premium game surface: quiet monochrome UI chrome, vivid player discs, strong weight typography, and spring-based motion. The game board is the main object; surrounding controls should feel like precise physical controls, not a marketing page or decorative dashboard.

The default layout is a centered single-column play experience with a maximum game width around 500px. It must stay immediately playable on mobile, with settings and history hidden until requested.

## Colors

The interface uses neutral zinc-like surfaces for structure and reserves saturated color for game state. Player colors are functional identity tokens, not decoration.

- **Primary (#18181b):** main light-mode action buttons, active segmented selections, and high-emphasis text.
- **Surface (#ffffff) and Surface Muted (#f4f4f5):** light-mode page, cards, holes, panels, and inactive controls.
- **Surface Dark (#18181b) and Surface Dark Muted (#09090b):** dark-mode panels, board frame, page, and board holes.
- **Player Red (#ef4444) and Player Yellow (#fbbf24):** default disc colors, active-player glow, confetti, and winner emphasis.
- **Ocean and Sunset pairs:** alternate player palettes only; do not use them as unrelated brand accents.
- **Success, Warning, Danger:** status states for online connection, waiting states, timer pressure, pause/resume, and errors.

Use custom player colors only where user settings provide them. All other UI should remain neutral so the active player color carries the game state.

## Typography

Use the system sans stack through Tailwind defaults. The app relies on weight, casing, and spacing rather than custom fonts.

Headlines and score numbers are black-weight (`font-black`) and compact. Labels use small uppercase text with wide tracking. Timers use a monospace face to keep changing values stable.

Do not use viewport-scaled type. Keep text sizes stable and adjust layout, wrapping, or container width for localization. Arabic strings must remain legible in RTL and use localized numeric display where the app already does so.

## Layout

The app is a vertical play surface:

- Page content is constrained to roughly `max-w-xl` with `24px` horizontal padding.
- The board is constrained to roughly `500px` and uses a fixed `7 / 6` aspect ratio.
- Board cells use a 7-column by 6-row grid with `8px` gaps on mobile and `12px` gaps on larger screens.
- Primary controls sit below the board in stacked groups: icon toolbar, expandable settings, then full-width reset/new-game action.
- Overlays and modals are fixed, centered, and dim the page with a dark translucent backdrop plus blur.

Keep interaction targets at least `40px` high/wide. Avoid layout shifts when timers, localized text, or online game codes change.

## Elevation & Depth

Depth should feel tactile and restrained. Use shadows to separate interactive layers, not to decorate static sections.

- Board: `shadow-xl`, subtle border, and active-player colored glow only while the game is active and unpaused.
- Controls: `shadow-sm` with border contrast for light/dark separation.
- Primary action: stronger shadow to make the new-game action feel final.
- Modals: `shadow-2xl` with backdrop blur and a clear border.
- Discs: minimal shadow plus animated drop motion; winning discs receive a white ring and pulse.

Do not add decorative gradient blobs or unrelated background effects beyond the existing soft player-color ambient glows.

## Shapes

The product language is rounded and touch-friendly:

- Board frame and tool buttons: `16px` radius.
- Segmented control containers: `12px` radius.
- Segmented active pills: `8px` radius.
- Modals and major picker surfaces: `32px` radius.
- Discs, status dots, toggles, and swatches: fully round.

Use roundness consistently to indicate interactivity. Do not nest cards inside cards; use borders, spacing, and full-width groups instead.

## Components

**Board:** A tactile recessed grid with neutral frame, circular holes, animated colored discs, and hover drop indicators. The board must preserve the 7x6 grid and support tabletop inversion without changing the data model.

**Piece:** A full circular disc using the active player token or user-selected color. Winning pieces use a pulse and ring; ghost/preview pieces are transparent with a dashed border.

**Status Bar:** A translucent bordered panel showing active player, AI thinking state, and timers. The active player indicator should animate subtly and inherit the current player color.

**Icon Toolbar:** Four equal-width icon buttons for undo, history, pause/resume, and settings. Use Lucide icons and `title` labels. Disabled buttons reduce opacity and must not look clickable.

**Settings Panel:** A bordered expandable panel containing segmented controls, theme swatches, language selection, timer controls, and online game controls. Keep density high but readable.

**Segmented Controls:** Use a neutral container with a moving active background powered by `motion` layout animations. Active text flips to high contrast.

**Modals:** Centered, rounded, high-elevation surfaces for winners, color picker, and custom timer. The close affordance is circular and placed at the logical `end` side for RTL compatibility.

## Do's and Don'ts

Do preserve the game-first layout and keep the board as the visual anchor.

Do update light and dark states together when adding a control.

Do update the shared locale registry and translated UI copy together for any user-facing text.

Do preserve RTL direction, logical positioning, and Arabic numeral conversion.

Do use player colors only for player identity, turn state, and outcome feedback.

Don't introduce a landing-page hero, marketing cards, or explanatory onboarding as the first screen.

Don't replace Lucide controls with text labels when an icon is already clear.

Don't add broad palettes, decorative gradients, or unrelated brand colors.

Don't let localized text resize fixed-format controls or overlap the board, buttons, timers, or modals.

Don't remove motion cues from piece drops, active segmented selections, pause overlays, or modal transitions without replacing them with an equally clear state cue.
