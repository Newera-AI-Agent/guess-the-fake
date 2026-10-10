# TASK CONTRACT (immutable product obligation)

**Original request:** Build "Guess the Fake" — a complete, polished, playable browser game for Pollinations quest #15725, and ship it.

GOAL
Players are shown TWO images side by side and must guess which one was AI-generated before a countdown timer runs out. Fun, fast, replayable, mobile-friendly.

STACK (mandatory)
- Next.js 15 App Router + TypeScript + Tailwind CSS.
- Fully client-side / static: set `output: 'export'` in next.config, `images: { unoptimized: true }`. No server runtime, no API routes, no secrets, no environment variables needed at runtime.
- Must build green with `npm run build` producing `out/` (static export). Vercel-free-tier compatible.
- Add Vitest + @testing-library/react for unit tests of the pure game logic.

REPO
- Public GitHub repository under the Newera-AI-Agent org. Commit ALL source at the repo root (never commit node_modules, .next, out).

CONTENT — MAX 10 IMAGES TOTAL (hard constraint)
Commit exactly 10 raster images into `public/images/` (do not hotlink at runtime; the game must work fully offline/self-contained):
- 5 REAL images: public-domain / CC0 photographs (e.g. Wikimedia Commons PD or Unsplash-licensed free assets). Record source + license in `public/images/CREDITS.md` and in an `ATTRIBUTION` section of README.
- 5 AI-GENERATED images: generate with the Pollinations image API, e.g. `curl -L -o public/images/ai-1.jpg "https://image.pollinations.ai/prompt/<urlencoded-prompt>?width=768&height=768&nologo=true&seed=<n>"`. Use 5 distinct, visually varied prompts (photorealistic scenes that plausibly look like real photos). Verify each downloaded file is a valid image (non-trivial byte size, correct magic bytes) — retry with a different seed/model if a download fails or returns an error page.
- Keep each image reasonably small (target < 400 KB, JPEG/WebP) so the static bundle stays light.

GAMEPLAY REQUIREMENTS
- A round shows two images and the prompt: "Which one is AI-generated?"
- Countdown timer per round (e.g. 10 seconds) with a visible progress bar/number; when it hits 0 the round is a loss (timeout) and reveals the answer.
- Clicking an image locks in the guess, immediately reveals the truth (highlight correct vs incorrect, show which was AI vs real), and awards points.
- Scoring: base points per correct answer + speed bonus scaled by remaining time; streak multiplier for consecutive correct answers. Timeout or wrong answer resets the streak.
- Progression: 10 rounds (all 10 images used exactly once as the AI/real pair, shuffled per game with a Fisher-Yates shuffle), then a final results screen.
- Results screen: score, correct count out of 10, longest streak, accuracy %, a fun rank/title, and "Play again" (fresh shuffle) + share/copy-result button using the Web Share API with clipboard fallback.
- Polish: sound-free but with subtle motion; correct/incorrect feedback animations; no layout shift; no external network calls during play.

UX / QUALITY BAR
- Clean modern dark UI, Tailwind only (no heavy UI libs), responsive from 360px phones to desktop, large tap targets.
- Required states: start/how-to-play screen, playing, round result, game over, and an offline-safe asset-loading state (preload images with a loading indicator before the first round).
- Accessibility: keyboard operable (1/2 or arrow keys to pick, Enter to continue), visible focus rings, aria-live announcements for correct/incorrect/timeout, respects `prefers-reduced-motion`, sufficient color contrast.
- Persist best score in localStorage.

TESTS
- Unit tests for: shuffle determinism given a seed, score computation (base + speed bonus + streak), timeout handling, and round progression to game over. Run them and make them pass.

VERIFICATION (do all of it, for real)
1. `npm ci`/`npm install` then `npm run test` green.
2. `npm run build` green and `out/index.html` exists.
3. `npx serve out` (or python3 -m http.server in out) and curl the root to confirm HTTP 200 and that the HTML references the built JS/CSS assets.
4. Sanity-check that all 10 images exist in `out/images/` with non-zero size.
5. Commit and push ALL source to git at the repo root.

DELIVERABLES
- Public GitHub repo URL.
- Confirmation the static export build is green, with the exact command output summarized.
- A ready-to-run Vercel path documented in README (import repo -> framework Next.js -> build `npm run build` -> output dir `out`).
- Deploy request: after a verified green build, request a Cloudflare Pages deploy (subdomain `guessthefake`, mode permanent) and report the live URL.

OUT OF SCOPE: any backend, database, auth, analytics, ads, or additional images beyond the 10 specified.
**Normalized interpretation:** Build "Guess the Fake" — a complete, polished, playable browser game for Pollinations quest #15725, and ship it.; GOAL; Players are shown TWO images side by side and must guess which one was AI-generated before a countdown timer runs out.; Fun, fast, replayable, mobile-friendly.; STACK (mandatory); Next.js 15 App Router + TypeScript + Tailwind CSS.; Fully client-side / static: set `output: 'export'` in next.config, `images: { unoptimized: true }`.; No server runtime, no API routes, no secrets, no environment variables needed at runtime.; Must build green with `npm run build` producing `out/` (static export).; Vercel-free-tier compatible.; Add Vitest + @testing-library/react for unit tests of the pure game logic.; REPO; Public GitHub repository under the Newera-AI-Agent org.; Commit ALL source at the repo root (never commit node_modules, .next, out).; CONTENT — MAX 10 IMAGES TOTAL (hard constraint); Commit exactly 10 raster images into `public/images/` (do not hotlink at runtime;; the game must work fully offline/self-contained):; REAL images: public-domain / CC0 photographs (e.g.; Wikimedia Commons PD or Unsplash-licensed free assets).; Record source + license in `public/images/CREDITS.md` and in an `ATTRIBUTION` section of README.
**Execution profile:** marathon
**Created:** 2026-10-10T07:59:14.361Z

## Requirements

| ID | Description | Mandatory | Status | Evidence | Acceptance Criteria |
|----|-------------|-----------|--------|----------|---------------------|
| REQ-001 | Build "Guess the Fake" — a complete, polished, playable browser game for Pollinations quest #15725, and ship it. | YES | pending | — | A relevant build or static verification passed after the latest relevant edit. |
| REQ-002 | GOAL | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-003 | Players are shown TWO images side by side and must guess which one was AI-generated before a countdown timer runs out. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-004 | Fun, fast, replayable, mobile-friendly. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-005 | STACK (mandatory) | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-006 | Next.js 15 App Router + TypeScript + Tailwind CSS. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-007 | Fully client-side / static: set `output: 'export'` in next.config, `images: { unoptimized: true }`. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-008 | No server runtime, no API routes, no secrets, no environment variables needed at runtime. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-009 | Must build green with `npm run build` producing `out/` (static export). | YES | pending | — | A relevant build or static verification passed after the latest relevant edit. |
| REQ-010 | Vercel-free-tier compatible. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-011 | Add Vitest + @testing-library/react for unit tests of the pure game logic. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-012 | REPO | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-013 | Public GitHub repository under the Newera-AI-Agent org. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-014 | Commit ALL source at the repo root (never commit node_modules, .next, out). | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-015 | CONTENT — MAX 10 IMAGES TOTAL (hard constraint) | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-016 | Commit exactly 10 raster images into `public/images/` (do not hotlink at runtime; | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-017 | the game must work fully offline/self-contained): | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-018 | REAL images: public-domain / CC0 photographs (e.g. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-019 | Wikimedia Commons PD or Unsplash-licensed free assets). | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |
| REQ-020 | Record source + license in `public/images/CREDITS.md` and in an `ATTRIBUTION` section of README. | YES | pending | — | Concrete implementation evidence is recorded and the outcome matches the user request. |

## Feature Matrix
- Build "Guess the Fake" — a complete, polished, playable browser game for Pollinations quest #15725, and ship it.
- GOAL
- Players are shown TWO images side by side and must guess which one was AI-generated before a countdown timer runs out.
- Fun, fast, replayable, mobile-friendly.
- STACK (mandatory)
- Next.js 15 App Router + TypeScript + Tailwind CSS.
- Fully client-side / static: set `output: 'export'` in next.config, `images: { unoptimized: true }`.
- No server runtime, no API routes, no secrets, no environment variables needed at runtime.
- Must build green with `npm run build` producing `out/` (static export).
- Vercel-free-tier compatible.
- Add Vitest + @testing-library/react for unit tests of the pure game logic.
- REPO
- Public GitHub repository under the Newera-AI-Agent org.
- Commit ALL source at the repo root (never commit node_modules, .next, out).
- CONTENT — MAX 10 IMAGES TOTAL (hard constraint)
- Commit exactly 10 raster images into `public/images/` (do not hotlink at runtime;
- the game must work fully offline/self-contained):
- REAL images: public-domain / CC0 photographs (e.g.
- Wikimedia Commons PD or Unsplash-licensed free assets).
- Record source + license in `public/images/CREDITS.md` and in an `ATTRIBUTION` section of README.

## Test Matrix
- Build "Guess the Fake" — a complete, polished, playable browser game for Pollinations quest #15725, and ship it.
- Must build green with `npm run build` producing `out/` (static export).
- Add Vitest + @testing-library/react for unit tests of the pure game logic.

## Platform Requirements
- Web
- Verified live URL

## Completion: 0/20 mandatory requirements have evidence
