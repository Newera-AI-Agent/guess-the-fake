# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-10

### Added
- Initial release of Guess the Fake game for Pollinations quest #15725
- 10-round gameplay with Fisher-Yates shuffle
- 10-second countdown timer with progress bar
- Scoring system: base points + speed bonus + streak multiplier
- Results screen with score, accuracy, streak, and fun rank/title
- Play again functionality with fresh shuffle
- Share results via Web Share API with clipboard fallback
- Keyboard navigation (1/2 or Arrow keys, Enter to continue)
- Full accessibility support:
  - aria-live announcements for correct/incorrect/timeout
  - Visible focus rings
  - Respects prefers-reduced-motion
  - Sufficient color contrast
- localStorage persistence for best score
- Asset preloading with loading indicator
- Offline-first: all 10 images bundled, no runtime network calls

### Content
- 5 REAL images: Public domain / CC0 from Wikimedia Commons
- 5 AI-GENERATED images: Created via Pollinations API
- CREDITS.md with full source/license attribution
- README.md with ATTRIBUTION section

### Technical
- Next.js 15 App Router + TypeScript + Tailwind CSS
- Static export (output: 'export', images: { unoptimized: true })
- No server runtime, API routes, secrets, or env vars
- Vercel-free-tier compatible
- Vitest + @testing-library/react unit tests (19 tests)
- Tests cover: shuffle determinism, score computation, timeout handling, round progression

### Build & Deploy
- GitHub Actions CI pipeline
- Cloudflare Pages deploy (newera-guessthefake.pages.dev)
- Vercel deployment documented in README

## [0.1.0] - 2026-10-10

### Added
- Project scaffold with Next.js 15, TypeScript, Tailwind CSS
- Game logic module (shuffle, scoring, timer, round progression)
- UI components: StartScreen, GameScreen, RoundResult, GameOver
- 10 images downloaded and committed
- Basic styling and dark theme
