// Game logic for Guess the Fake — pure, deterministic, framework-free.
// Every function here is unit-testable without a DOM.

export type ImageType = 'real' | 'ai'

export interface GameImage {
  id: string
  src: string
  type: ImageType
  prompt?: string
  credit?: string
}

export interface RoundData {
  images: [GameImage, GameImage]
  aiIndex: 0 | 1
  roundNumber: number
  timeLimit: number
}

export interface RoundResult {
  roundNumber: number
  aiIndex: 0 | 1
  playerGuess: 0 | 1 | null
  isCorrect: boolean
  timeRemaining: number
  pointsEarned: number
  streakAtRound: number
}

export interface GameState {
  status: 'start' | 'playing' | 'round-result' | 'game-over'
  rounds: RoundData[]
  currentRound: number
  totalRounds: number
  timeLimit: number
  timeRemaining: number
  score: number
  streak: number
  longestStreak: number
  correctCount: number
  roundResults: RoundResult[]
  currentRoundData: RoundData | null
  isGuessLocked: boolean
  playerGuess: 0 | 1 | null
  showAnswer: boolean
  // Flat mirrors of the most recent round outcome, so the UI can read them directly.
  aiIndex: 0 | 1 | null
  isCorrect: boolean | null
  pointsEarned: number | null
  lastResult: RoundResult | null
  seed: number
}

export interface FinalResults {
  score: number
  correctCount: number
  totalRounds: number
  longestStreak: number
  accuracy: number
  rank: string
  roundResults: RoundResult[]
}

// All 10 game images (5 real public-domain photographs, 5 AI-generated).
export const GAME_IMAGES: GameImage[] = [
  { id: 'real-1', src: '/images/real-1.jpg', type: 'real', credit: 'NASA (public domain)' },
  { id: 'real-2', src: '/images/real-2.jpg', type: 'real', credit: 'NASA (public domain)' },
  { id: 'real-3', src: '/images/real-3.jpg', type: 'real', credit: 'NOAA (public domain)' },
  { id: 'real-4', src: '/images/real-4.jpg', type: 'real', credit: 'USGS (public domain)' },
  { id: 'real-5', src: '/images/real-5.jpg', type: 'real', credit: 'ESA (CC BY-SA 3.0 IGO)' },
  { id: 'ai-1', src: '/images/ai-1.jpg', type: 'ai', prompt: 'photorealistic majestic mountain landscape at golden hour, dramatic lighting, ultra detailed' },
  { id: 'ai-2', src: '/images/ai-2.jpg', type: 'ai', prompt: 'photorealistic crystal clear mountain lake reflection, pine trees, pristine nature' },
  { id: 'ai-3', src: '/images/ai-3.jpg', type: 'ai', prompt: 'photorealistic aurora borealis over snowy mountains, vibrant green and purple lights' },
  { id: 'ai-4', src: '/images/ai-4.jpg', type: 'ai', prompt: 'photorealistic tropical beach at sunset, turquoise water, palm trees, golden hour' },
  { id: 'ai-5', src: '/images/ai-5.jpg', type: 'ai', prompt: 'photorealistic ancient forest with sun rays filtering through the canopy' },
]

// Deterministic pseudo-random generator (mulberry32). Same seed => same sequence.
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0
  return function random(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fisher-Yates shuffle. Deterministic when a seed is supplied.
export function shuffleArray<T>(array: readonly T[], seed?: number): T[] {
  const random = createSeededRandom(seed ?? Date.now())
  return shuffleWith(array, random)
}

function shuffleWith<T>(array: readonly T[], random: () => number): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}

const ROUNDS_PER_PASS = 5

// Build 10 rounds. Each round pairs exactly one real image with one AI image, and
// every one of the 10 images appears exactly twice across the game. Both the pairings
// and the AI/real left-right position come from the seeded RNG, so one seed = one game.
export function createRounds(
  images: readonly GameImage[],
  timeLimit = 10,
  seed = 1,
): RoundData[] {
  const realImages = images.filter((img) => img.type === 'real')
  const aiImages = images.filter((img) => img.type === 'ai')
  if (realImages.length === 0 || aiImages.length === 0) return []

  const random = createSeededRandom(seed)
  const rounds: RoundData[] = []

  for (let pass = 0; pass < 2; pass++) {
    const realOrder = shuffleWith(realImages, random)
    const aiOrder = shuffleWith(aiImages, random)
    // Offset the AI pairing on the second pass so the ten rounds are not repeats.
    const offset = pass * 2

    for (let i = 0; i < ROUNDS_PER_PASS; i++) {
      const real = realOrder[i % realOrder.length]
      const ai = aiOrder[(i + offset) % aiOrder.length]
      const aiIndex: 0 | 1 = random() < 0.5 ? 0 : 1
      const pair: [GameImage, GameImage] = aiIndex === 0 ? [ai, real] : [real, ai]

      rounds.push({
        images: pair,
        aiIndex,
        roundNumber: rounds.length + 1,
        timeLimit,
      })
    }
  }

  return rounds
}

// Scoring: base points + speed bonus scaled by remaining time, times a streak multiplier.
export const BASE_POINTS = 100
export const MAX_SPEED_BONUS = 50
export const STREAK_MULTIPLIER = 0.2

export function calculatePoints(timeRemaining: number, timeLimit: number, streak: number): number {
  if (timeLimit <= 0) return BASE_POINTS
  const clamped = Math.max(0, Math.min(timeRemaining, timeLimit))
  const speedRatio = clamped / timeLimit
  const speedBonus = Math.round(MAX_SPEED_BONUS * speedRatio)
  const streakMultiplier = 1 + streak * STREAK_MULTIPLIER
  return Math.round((BASE_POINTS + speedBonus) * streakMultiplier)
}

// A fresh game sitting on the how-to-play screen.
export function initializeGame(timeLimit = 10, seed?: number): GameState {
  const gameSeed = seed ?? Math.floor(Math.random() * 1_000_000_000)
  const rounds = createRounds(GAME_IMAGES, timeLimit, gameSeed)

  return {
    status: 'start',
    rounds,
    currentRound: 0,
    totalRounds: rounds.length,
    timeLimit,
    timeRemaining: timeLimit,
    score: 0,
    streak: 0,
    longestStreak: 0,
    correctCount: 0,
    roundResults: [],
    currentRoundData: null,
    isGuessLocked: false,
    playerGuess: null,
    showAnswer: false,
    aiIndex: null,
    isCorrect: null,
    pointsEarned: null,
    lastResult: null,
    seed: gameSeed,
  }
}

// Transition from the start screen into round 1.
export function startGame(state: GameState): GameState {
  if (state.rounds.length === 0) return state
  const first = state.rounds[0]

  return {
    ...state,
    status: 'playing',
    currentRound: first.roundNumber,
    currentRoundData: first,
    timeRemaining: first.timeLimit,
    isGuessLocked: false,
    playerGuess: null,
    showAnswer: false,
    aiIndex: null,
    isCorrect: null,
    pointsEarned: null,
  }
}

// Countdown tick: one second per call. Hits the timeout path at zero.
export function tick(state: GameState): GameState {
  if (state.status !== 'playing' || state.isGuessLocked) return state

  const timeRemaining = Math.max(0, state.timeRemaining - 1)
  if (timeRemaining === 0) {
    return processTimeout({ ...state, timeRemaining: 0 })
  }
  return { ...state, timeRemaining }
}

export function processGuess(state: GameState, guess: 0 | 1): GameState {
  if (!state.currentRoundData || state.isGuessLocked) return state

  const { aiIndex, timeLimit, roundNumber } = state.currentRoundData
  const isCorrect = guess === aiIndex
  const timeRemaining = Math.max(0, Math.min(state.timeRemaining, timeLimit))
  const streakBefore = state.streak
  const pointsEarned = isCorrect ? calculatePoints(timeRemaining, timeLimit, streakBefore) : 0
  const streak = isCorrect ? streakBefore + 1 : 0

  const lastResult: RoundResult = {
    roundNumber,
    aiIndex,
    playerGuess: guess,
    isCorrect,
    timeRemaining,
    pointsEarned,
    streakAtRound: streakBefore,
  }

  return {
    ...state,
    status: 'round-result',
    isGuessLocked: true,
    playerGuess: guess,
    showAnswer: true,
    aiIndex,
    isCorrect,
    pointsEarned,
    lastResult,
    score: state.score + pointsEarned,
    streak,
    longestStreak: Math.max(state.longestStreak, streak),
    correctCount: state.correctCount + (isCorrect ? 1 : 0),
    roundResults: [...state.roundResults, lastResult],
  }
}

export function processTimeout(state: GameState): GameState {
  if (!state.currentRoundData || state.isGuessLocked) return state

  const { aiIndex, roundNumber } = state.currentRoundData

  const lastResult: RoundResult = {
    roundNumber,
    aiIndex,
    playerGuess: null,
    isCorrect: false,
    timeRemaining: 0,
    pointsEarned: 0,
    streakAtRound: state.streak,
  }

  return {
    ...state,
    status: 'round-result',
    isGuessLocked: true,
    playerGuess: null,
    showAnswer: true,
    aiIndex,
    isCorrect: false,
    pointsEarned: 0,
    lastResult,
    timeRemaining: 0,
    streak: 0,
    roundResults: [...state.roundResults, lastResult],
  }
}

// Advance to the next round using the stored round list; ends the game after the last one.
export function nextRound(state: GameState): GameState {
  const nextIndex = state.currentRound
  if (nextIndex >= state.rounds.length) {
    return { ...state, status: 'game-over' }
  }

  const round = state.rounds[nextIndex]
  return {
    ...state,
    status: 'playing',
    currentRound: round.roundNumber,
    currentRoundData: round,
    timeRemaining: round.timeLimit,
    isGuessLocked: false,
    playerGuess: null,
    showAnswer: false,
    aiIndex: null,
    isCorrect: null,
    pointsEarned: null,
  }
}

export function calculateFinalResults(state: GameState): FinalResults {
  const answered = state.roundResults.length
  const accuracy = answered > 0 ? Math.round((state.correctCount / answered) * 100) : 0

  let rank = 'Novice Observer'
  if (state.score >= 2500) rank = 'Master Detector'
  else if (state.score >= 1800) rank = 'Expert Spotter'
  else if (state.score >= 1200) rank = 'Keen Eye'
  else if (state.score >= 600) rank = 'Sharp Watcher'
  else if (state.score >= 250) rank = 'Casual Player'

  return {
    score: state.score,
    correctCount: state.correctCount,
    totalRounds: state.totalRounds,
    longestStreak: state.longestStreak,
    accuracy,
    rank,
    roundResults: state.roundResults,
  }
}

export function generateShareText(results: FinalResults): string {
  return [
    'Guess the Fake',
    `Score: ${results.score}`,
    `Correct: ${results.correctCount}/${results.totalRounds}`,
    `Accuracy: ${results.accuracy}%`,
    `Longest streak: ${results.longestStreak}`,
    `Rank: ${results.rank}`,
  ].join('\n')
}

// Best score persistence (guarded so it is safe during static export / SSR).
const BEST_SCORE_KEY = 'guess-the-fake:best-score'

export function loadBestScore(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY)
    if (raw === null) return 0
    const value = Number.parseInt(raw, 10)
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

export function saveBestScore(score: number): number {
  const best = Math.max(loadBestScore(), Math.floor(score))
  if (typeof window === 'undefined') return best
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(best))
  } catch {
    // Storage unavailable (private mode) — the score still counts for this session.
  }
  return best
}
