# RELAY HANDOFF — job vm-mv23ixfr-jaki8ofd (VM 1 of 3)
Written at the 15-minute checkpoint with 15 min left, after 62 steps.

## Original task
Build "Guess the Fake" — a complete, polished, playable browser game for Pollinations quest #15725, and ship it.

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

## DEPLOY (user pre-approved)
When the build VERIFIABLY passes, call request_deploy{subdomain:"guessthefake", mode:"permanent"} IMMEDIATELY — the user already approved newera-guessthefake.pages.dev. Do not ask again; do not deploy off a red build. If the tool returns an error, RETRY it — never claim the site is live unless request_deploy returned ok. (The harness also auto-requests this at wind-down as a safety net, but call it yourself the moment the build is green.)

## Progress so far
(no rolling summary was generated — reconstruct state from the git log below and the repo itself)

## Worklog (latest lines — every VM in this chain appended)
# VM Agent Worklog
Durable session memory for this VM job chain. Each line is one step or wind-down from one VM. Read it on boot; never delete it.
- [2026-10-10T07:52:16.452Z | VM 1/3] boot: VM 1/3 online (job vm-mv23ixfr-jaki8ofd, 60 min budget)
- [2026-10-10T07:52:16.453Z | VM 1/3] self-check PASS: shell: VERIFIED (the harness executed bash on this VM at boot); node: v24.21.0; npm: 11.19.0; python3: Python 3.12.3; git: repo checked out @ 9fba64c; filesystem: WRITABLE (the harness wrote + read back a probe file); skills: 22 knowledge docs in .newera/skills/ (list_skills / read_skill); project: 
- [2026-10-10T08:00:18.199Z | VM 1/3] PLAN updated: 16 steps
- [2026-10-10T08:05:30.208Z | VM 1/3] VERIFIED green: curl -L -o public/images/ai-1.jpg "https://image.pollinations.ai/prompt/photorealistic%20majestic%20mountain%20landscape%20at%20golden%20hour%20dramatic%20light
- [2026-10-10T08:16:34.514Z | VM 1/3] PLAN updated: 16 steps

## Repository state
Changed/added files:
?? .newera/vm/PLAN.json
?? .newera/vm/WORKLOG.md
?? agent.log
?? next.config.js
?? node_modules/
?? package-lock.json
?? package.json
?? postcss.config.js
?? public/
?? src/
?? tailwind.config.js
?? tsconfig.json

Recent commits:
9fba64c newera: VM agent job vm-mv23ixfr-jaki8ofd

## Current plan (todo state)
## CURRENT PLAN (16 steps)
1. [x] Scaffold Next.js 15 App Router project with TypeScript and Tailwind CSS (req REQ-005,REQ-0 (req REQ-005,REQ-006)
2. [x] Configure next.config.js for static export (output: 'export', images: { unoptimized: true  (req REQ-007,REQ-008)
3. [x] Create game logic module (shuffle, scoring, timer, round progression) (req REQ-003,REQ-004 (req REQ-003,REQ-004)
4. [x] Download 5 public-domain/CC0 real images to public/images/ (req REQ-015,REQ-016,REQ-018,RE (req REQ-015,REQ-016,REQ-018,REQ-019)
5. [x] Generate 5 AI images via Pollinations API to public/images/ (req REQ-015,REQ-016,REQ-017) (req REQ-015,REQ-016,REQ-017)
6. [x] Create CREDITS.md with source/license attribution (req REQ-020) (req REQ-020)
7. [~] Build UI components: StartScreen, GameScreen, RoundResult, GameOver (req REQ-003,REQ-004) (req REQ-003,REQ-004)  <- NOW
8. [ ] Implement accessibility: keyboard nav, aria-live, focus rings, reduced motion (req REQ-004 (req REQ-004)
9. [ ] Add localStorage persistence for best score (req REQ-004) (req REQ-004)
10. [ ] Write unit tests with Vitest + @testing-library/react for game logic (req REQ-011) (req REQ-011)
11. [ ] Run npm install, then npm run test (must pass) (req REQ-011) (req REQ-011)
12. [ ] Run npm run build (must produce out/ with index.html) (req REQ-009) (req REQ-009)
13. [ ] Verify build output: serve out/, curl root, check images in out/images/ (req REQ-009) (req REQ-009)
14. [ ] Update README with ATTRIBUTION section and Vercel deploy instructions (req REQ-012,REQ-013 (req REQ-012,REQ-013,REQ-014,REQ-020)
15. [ ] Commit all source to git at repo root (req REQ-014) (req REQ-014)
16. [ ] Request Cloudflare Pages deploy (subdomain: guessthefake) (req REQ-001) (req REQ-001)
6/16 steps done

## Contract status
## TASK CONTRACT — the requirement matrix the user approved (SCOPE LOCK)
- [pending] REQ-001 — Build "Guess the Fake" — a complete, polished, playable browser game for Pollinations quest #15725, and ship it. (MANDATORY) | acceptance: A relevant build or static verification passed after the latest relevant edit.
- [pending] REQ-002 — GOAL (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-003 — Players are shown TWO images side by side and must guess which one was AI-generated before a countdown timer runs out. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-004 — Fun, fast, replayable, mobile-friendly. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-005 — STACK (mandatory) (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-006 — Next.js 15 App Router + TypeScript + Tailwind CSS. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-007 — Fully client-side / static: set `output: 'export'` in next.config, `images: { unoptimized: true }`. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-008 — No server runtime, no API routes, no secrets, no environment variables needed at runtime. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-009 — Must build green with `npm run build` producing `out/` (static export). (MANDATORY) | acceptance: A relevant build or static verification passed after the latest relevant edit.
- [pending] REQ-010 — Vercel-free-tier compatible. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-011 — Add Vitest + @testing-library/react for unit tests of the pure game logic. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-012 — REPO (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-013 — Public GitHub repository under the Newera-AI-Agent org. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-014 — Commit ALL source at the repo root (never commit node_modules, .next, out). (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-015 — CONTENT — MAX 10 IMAGES TOTAL (hard constraint) (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-016 — Commit exactly 10 raster images into `public/images/` (do not hotlink at runtime; (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-017 — the game must work fully offline/self-contained): (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-018 — REAL images: public-domain / CC0 photographs (e.g. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-019 — Wikimedia Commons PD or Unsplash-licensed free assets). (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
- [pending] REQ-020 — Record source + license in `public/images/CREDITS.md` and in an `ATTRIBUTION` section of README. (MANDATORY) | acceptance: Concrete implementation evidence is recorded and the outcome matches the user request.
Work ONLY on these requirements — anything else is out of scope. Mark progress with update_contract. finish requires every MANDATORY requirement complete (or blocked with documented evidence).

## What the next VM must do
1. Check the repo state above — everything committed so far is real and on disk.
2. Do NOT redo finished work. Verify what exists (build, tests) before touching anything.
3. Continue the ORIGINAL task to completion, then finish with an honest summary.
4. If a deploy was requested and the build is green, make sure request_deploy was called (see .newera/vm/deploy-request.json).
