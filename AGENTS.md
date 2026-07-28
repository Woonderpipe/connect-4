# AGENTS.md

## Project Overview

This is a Next.js App Router Connect 4 game built with React 19, TypeScript, Tailwind CSS 4, `motion`, PocketBase, PeerJS, and `pnpm`.

The app supports local PvP, player-vs-AI, online play, timers, undo, move history, theming, dark mode, tabletop mode, SEO content, and 16 global language routes.

## Commands

- Install dependencies: `pnpm install`
- Run the dev server: `pnpm dev`
- Dev URL: `http://localhost:4444`
- Production build: `pnpm build`
- Production server: `pnpm start`
- Lint: `pnpm lint`
- Dependency audit: `pnpm audit`
- Release check: `pnpm prepublish:check`

Use `pnpm`, not `npm` or `yarn`, for project commands. The package metadata pins `pnpm@11.15.1` and Node.js `24.18.0`.

## Repository Structure

- `app/`: Next.js App Router pages, layout, metadata images, sitemap, and robots.
- `components/Connect4/`: Main game UI split into board, controls, status, modals, move history, pieces, and SEO section.
- `components/`: Shared providers and toggles.
- `hooks/use-connect4.ts`: Main game state orchestration, persistence, timers, AI turn scheduling, online lifecycle, and UI-facing actions.
- `lib/connect4-logic.ts`: Pure board rules, win detection, board evaluation, minimax, and AI move selection.
- `lib/pocketbase.ts`: PocketBase game CRUD and subscription helpers.
- `lib/seo.ts`: Localized SEO metadata, structured data, routes, and alternates.
- `locales/`: UI translation JSON for `en`, `de`, and `ar`.
- `public/`: Static assets.

## Coding Conventions

- Keep TypeScript strict-compatible and prefer explicit types on shared logic and exported APIs.
- Use the configured `@/*` path alias for cross-folder imports.
- Follow the existing component split instead of folding game behavior into pages.
- Keep pure game logic in `lib/connect4-logic.ts`; keep React state, browser persistence, timers, and online coordination in `hooks/use-connect4.ts`.
- Use existing utilities such as `cn` from `lib/utils.ts` and `toArabicNumerals` for localized numeric display.
- Keep changes focused. Avoid broad refactors, formatting churn, and new abstractions unless they clearly reduce complexity.
- Do not add dependencies unless the existing stack cannot reasonably solve the problem.

## UI And Styling

- Tailwind CSS is the primary styling system, with small global CSS only where needed.
- Preserve the current polished, high-contrast, motion-heavy game feel.
- Use `lucide-react` for icons when adding icon buttons or controls.
- Keep layouts responsive across mobile and desktop.
- Preserve dark mode, custom player colors, and tabletop board inversion when touching visual components.
- Preserve RTL layout and Arabic numeral rendering for Arabic-facing UI.

## Gameplay Rules

- Board dimensions and Connect 4 primitives live in `lib/connect4-logic.ts`.
- Keep AI difficulty behavior aligned with the current model:
  - `easy`: randomized move with center bias.
  - `medium`: minimax depth 3.
  - `hard`: minimax depth 5.
- When changing move legality, win detection, draw detection, scoring, or AI selection, update or add focused tests if a test pattern exists. If no test framework exists, at minimum validate with `pnpm lint` and `pnpm build`.
- Be careful with mutation in minimax: temporary board mutations must always be reset before returning.

## Game State And Persistence

- `use-connect4.ts` owns local game state, timers, stats, settings, and online session state.
- LocalStorage keys currently include:
  - `connect4_stats`
  - `connect4_theme`
  - `connect4_language`
  - `connect4_dark_mode`
  - `connect4_tabletop_mode`
  - `connect4_current_game`
- When adding or changing persisted state, update both hydration and save effects together.
- Keep restored games paused on load unless intentionally changing that behavior.
- Avoid reading browser-only APIs outside client components/effects.

## Online Play

- Online mode supports both PeerJS serverless flow and PocketBase-backed flow.
- `NEXT_PUBLIC_SERVERLESS !== 'false'` uses PeerJS.
- `NEXT_PUBLIC_SERVERLESS === 'false'` uses PocketBase at `NEXT_PUBLIC_POCKETBASE_URL`, defaulting to `http://127.0.0.1:8090`.
- Keep PeerJS and PocketBase behavior aligned when changing online gameplay.
- Preserve game-code joining from the `?game=` URL parameter.
- Do not hardcode production backend URLs, secrets, or private credentials.

## Internationalization And SEO

- User-facing game strings are in `lib/locales.ts` and `lib/translations.ts`.
- When adding or changing UI copy, update all three locale files in the same change.
- Arabic UI must preserve RTL behavior and Arabic numeral conversion where applicable.
- SEO route/content data lives in `lib/seo.ts`; keep canonical paths and language alternates consistent.
- `NEXT_PUBLIC_SITE_URL` controls canonical production URLs, with a fallback in `lib/seo.ts`.

## Validation

- For code changes, run the most relevant checks:
  - Small UI or logic change: `pnpm lint`
  - Shared logic, routing, metadata, config, or online-flow change: `pnpm lint` and `pnpm build`
  - Dependency/security-sensitive change: `pnpm audit`
- There is currently no dedicated test script in `package.json`; do not invent a new test framework for a small change.
- If a validation command cannot be run, report the reason and the residual risk.

## Safety Notes

- Preserve unrelated user changes in the working tree.
- The `.env` file may contain local configuration; do not print, copy, or commit secrets.
- Do not remove online-play support, localStorage persistence, language support, or SEO metadata unless explicitly requested.
