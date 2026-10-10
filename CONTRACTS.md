# CONTRACTS

AUTO-GENERATED after every successful file write. Do not edit by hand - your edits will be overwritten.

This is the authoritative list of what exists in this project. If a symbol is not listed here and not in a file you have read during this run, IT DOES NOT EXIST. Do not reference it. Read the file or write the symbol first.

## Dependencies (package.json)

- `@testing-library/react` `^16.0.0`
- `@types/node` `^22.0.0`
- `@types/react` `^18.3.0`
- `@types/react-dom` `^18.3.0`
- `autoprefixer` `^10.4.0`
- `jsdom` `^25.0.0`
- `next` `15.0.0`
- `postcss` `^8.4.0`
- `react` `18.3.1`
- `react-dom` `18.3.1`
- `tailwindcss` `^3.4.0`
- `typescript` `^5.6.0`
- `vitest` `^2.1.0`

Scripts: `dev`, `build`, `start`, `lint`, `test`, `test:watch`

## Files and public API

### `next.config.js` - 10 lines
- exports: (nothing public)

### `postcss.config.js` - 7 lines
- exports: (nothing public)

### `src/app/globals.css` - 120 lines
- exports: (nothing public)

### `src/app/layout.tsx` - 37 lines
- imports: `src/app/globals.css`
- `RootLayout` (function)
- `metadata` (const): description, openGraph, title
- `viewport` (const): initialScale, maximumScale, themeColor, width
- default export: `RootLayout`

### `src/app/page.tsx` - 6 lines
- imports: `src/components/Game.tsx`
- `Home` (function)
- default export: `Home`

### `src/components/Game.tsx` - 467 lines
- imports: `src/components/Providers.tsx`, `src/lib/game-logic.ts`
- `Game` (function)
- default export: `Game`

### `src/components/Providers.tsx` - 85 lines
- `ReducedMotionProvider` (function)
- `useReducedMotion` (function)
- `AnnouncerProvider` (function)
- `useAnnouncer` (function)
- `GameProviders` (function)

### `src/lib/game-logic.test.ts` - 468 lines
- imports: `src/lib/game-logic.ts`
- exports: (nothing public)

### `src/lib/game-logic.ts` - 373 lines
- `GameImage` (interface): credit, id, prompt, src, type
- `RoundData` (interface): aiIndex, images, roundNumber, timeLimit
- `RoundResult` (interface): aiIndex, isCorrect, playerGuess, pointsEarned, roundNumber, streakAtRound, timeRemaining
- `GameState` (interface): aiIndex, correctCount, currentRound, currentRoundData, isCorrect, isGuessLocked, lastResult, longestStreak, playerGuess, pointsEarned, roundResults, rounds, score, seed, showAnswer, status, streak, timeLimit, timeRemaining, totalRounds
- `FinalResults` (interface): accuracy, correctCount, longestStreak, rank, roundResults, score, totalRounds
- `createSeededRandom` (function)
- `shuffleArray` (function)
- `createRounds` (function)
- `calculatePoints` (function)
- `initializeGame` (function)
- `startGame` (function)
- `tick` (function)
- `processGuess` (function)
- `processTimeout` (function)
- `nextRound` (function)
- `calculateFinalResults` (function)
- `generateShareText` (function)
- `loadBestScore` (function)
- `saveBestScore` (function)
- `GAME_IMAGES` (const)
- `BASE_POINTS` (const)
- `MAX_SPEED_BONUS` (const)
- `STREAK_MULTIPLIER` (const)
- `ImageType` (type)

### `tailwind.config.js` - 66 lines
- exports: (nothing public)

### `vitest.config.ts` - 16 lines
- exports: (nothing public)

## Unresolved references

- (none) - every internal import resolves.
