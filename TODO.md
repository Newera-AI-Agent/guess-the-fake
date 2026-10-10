# Guess the Fake — Pollinations quest #15725 game

- [x] Dispatch VM agent with complete build brief (public repo, subdomain guessthefake)
- [x] First VM pass landed source but shipped broken code: no type-check, dead gameplay, fictional-API tests
- [x] Push collected source, reproduce real CI failure, and dispatch repair VM (which timed out with only the CSS fix landed)
- [~] Repair source locally: coherent GameState (timeLimit/aiIndex/isCorrect/pointsEarned/lastResult/rounds), deterministic seeded rounds, startGame, real countdown
- [ ] Rewrite UI (preload, progress bar, keyboard, share, best score) and tests against the real API; add CREDITS.md + README attribution
- [ ] static_check, push, watch CI build green
- [ ] Deploy to Cloudflare Pages at newera-guessthefake.pages.dev and deliver repo + live URL
