// Game logic for Guess the Fake

// Types
export type ImageType = 'real' | 'ai'

export interface GameImage {
  id: string
  src: string
  type: ImageType
  prompt?: string // For AI images
  credit?: string // For real images
}

export interface RoundData {
  images: [GameImage, GameImage] // shuffled pair
  aiIndex: 0 | 1 // which position has the AI image
  roundNumber: number // 1-10
  timeLimit: number // seconds
}

export interface GameState {
  status: 'start' | 'playing' | 'round-result' | 'game-over'
  currentRound: number
  totalRounds: number
  score: number
  streak: number
  longestStreak: number
  correctCount: number
  roundResults: RoundResult[]
  currentRoundData: RoundData | null
  timeRemaining: number
  isGuessLocked: boolean
  playerGuess: 0 | 1 | null
  showAnswer: boolean
}

export interface RoundResult {
  roundNumber: number
  aiIndex: 0 | 1
  playerGuess: 0 | 1 | null // null = timeout
  isCorrect: boolean
  timeRemaining: number
  pointsEarned: number
  streakAtRound: number
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

// All 10 game images (5 real, 5 AI)
export const GAME_IMAGES: GameImage[] = [
  // Real images
  { id: 'real-1', src: '/images/real-1.jpg', type: 'real', credit: 'Photo by NASA on Unsplash' },
  { id: 'real-2', src: '/images/real-2.jpg', type: 'real', credit: 'Photo by SpaceX on Unsplash' },
  { id: 'real-3', src: '/images/real-3.jpg', type: 'real', credit: 'Photo by NOAA on Unsplash' },
  { id: 'real-4', src: '/images/real-4.jpg', type: 'real', credit: 'Photo by USGS on Unsplash' },
  { id: 'real-5', src: '/images/real-5.jpg', type: 'real', credit: 'Photo by ESA on Unsplash' },
  // AI images
  { id: 'ai-1', src: '/images/ai-1.jpg', type: 'ai', prompt: 'photorealistic majestic mountain landscape at golden hour, dramatic lighting, ultra detailed 8k' },
  { id: 'ai-2', src: '/images/ai-2.jpg', type: 'ai', prompt: 'photorealistic crystal clear mountain lake reflection, pine trees, pristine nature, 8k photography' },
  { id: 'ai-3', src: '/images/ai-3.jpg', type: 'ai', prompt: 'photorealistic aurora borealis over snowy mountains, vibrant green and purple lights, 8k' },
  { id: 'ai-4', src: '/images/ai-4.jpg', type: 'ai', prompt: 'photorealistic tropical beach at sunset, crystal turquoise water, palm trees, golden hour lighting' },
  { id: 'ai-5', src: '/images/ai-5.jpg', type: 'ai', prompt: 'photorealistic ancient forest with sun rays filtering through canopy, mystical atmosphere, 8k' },
]

// Fisher-Yates shuffle with optional seed for determinism
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const arr = [...array]
  let currentIndex = arr.length
  let randomIndex: number

  // Simple seeded random for testing
  let seedValue = seed ?? Date.now()
  const random = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280
    return seedValue / 233280
  }

  while (currentIndex !== 0) {
    randomIndex = Math.floor(random() * currentIndex)
    currentIndex--
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]]
  }

  return arr
}

// Create rounds: pair each AI image with a real image, shuffle pairs
// We need 10 rounds using all 10 images exactly once
export function createRounds(images: GameImage[], timeLimit = 10): RoundData[] {
  const realImages = images.filter(img => img.type === 'real')
  const aiImages = images.filter(img => img.type === 'ai')

  // Shuffle both arrays independently
  const shuffledReal = shuffleArray(realImages)
  const shuffledAI = shuffleArray(aiImages)

  const rounds: RoundData[] = []

  for (let i = 0; i < 5; i++) {
    // Create pair: one real, one AI
    const pair: [GameImage, GameImage] = [shuffledReal[i], shuffledAI[i]]
    // Randomly decide which position gets the AI image
    const aiIndex = Math.random() < 0.5 ? 0 : 1
    const finalPair = aiIndex === 0 ? pair : [pair[1], pair[0]] as [GameImage, GameImage]

    rounds.push({
      images: finalPair,
      aiIndex,
      roundNumber: i + 1,
      timeLimit,
    })
  }

  // For rounds 6-10, swap the real/AI images to use all 10 images again
  // But with different pairings
  for (let i = 0; i < 5; i++) {
    const pair: [GameImage, GameImage] = [shuffledReal[(i + 2) % 5], shuffledAI[(i + 3) % 5]]
    const aiIndex = Math.random() < 0.5 ? 0 : 1
    const finalPair = aiIndex === 0 ? pair : [pair[1], pair[0]] as [GameImage, GameImage]

    rounds.push({
      images: finalPair,
      aiIndex,
      roundNumber: i + 6,
      timeLimit,
    })
  }

  return rounds
}

// Scoring constants
const BASE_POINTS = 100
const MAX_SPEED_BONUS = 50
const STREAK_MULTIPLIER = 0.2 // 20% per streak level

// Calculate points for a correct answer
export function calculatePoints(
  timeRemaining: number,
  timeLimit: number,
  streak: number
): number {
  const speedRatio = timeRemaining / timeLimit
  const speedBonus = Math.round(MAX_SPEED_BONUS * speedRatio)
  const streakMultiplier = 1 + streak * STREAK_MULTIPLIER
  const points = Math.round((BASE_POINTS + speedBonus) * streakMultiplier)
  return points
}

// Process a guess
export function processGuess(
  state: GameState,
  guess: 0 | 1
): GameState {
  if (!state.currentRoundData || state.isGuessLocked) {
    return state
  }

  const { aiIndex, timeLimit, roundNumber } = state.currentRoundData
  const isCorrect = guess === aiIndex
  const timeRemaining = state.timeRemaining
  const newStreak = isCorrect ? state.streak + 1 : 0
  const pointsEarned = isCorrect ? calculatePoints(timeRemaining, timeLimit, state.streak) : 0
  const longestStreak = Math.max(state.longestStreak, newStreak)

  const roundResult: RoundResult = {
    roundNumber,
    aiIndex,
    playerGuess: guess,
    isCorrect,
    timeRemaining,
    pointsEarned,
    streakAtRound: state.streak,
  }

  const newScore = state.score + pointsEarned

  return {
    ...state,
    isGuessLocked: true,
    playerGuess: guess,
    showAnswer: true,
    score: newScore,
    streak: newStreak,
    longestStreak,
    correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
    roundResults: [...state.roundResults, roundResult],
    status: 'round-result',
  }
}

// Process timeout
export function processTimeout(state: GameState): GameState {
  if (!state.currentRoundData || state.isGuessLocked) {
    return state
  }

  const { aiIndex, roundNumber } = state.currentRoundData

  const roundResult: RoundResult = {
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
    isGuessLocked: true,
    playerGuess: null,
    showAnswer: true,
    streak: 0,
    roundResults: [...state.roundResults, roundResult],
    status: 'round-result',
  }
}

// Advance to next round
export function nextRound(state: GameState, rounds: RoundData[]): GameState {
  const nextRoundIndex = state.currentRound

  if (nextRoundIndex >= rounds.length) {
    return {
      ...state,
      status: 'game-over',
    }
  }

  return {
    ...state,
    currentRound: nextRoundIndex + 1,
    currentRoundData: rounds[nextRoundIndex],
    timeRemaining: rounds[nextRoundIndex].timeLimit,
    isGuessLocked: false,
    playerGuess: null,
    showAnswer: false,
    status: 'playing',
  }
}

// Initialize new game
export function initializeGame(timeLimit = 10): GameState {
  const rounds = createRounds(GAME_IMAGES, timeLimit)
  return {
    status: 'start',
    currentRound: 0,
    totalRounds: rounds.length,
    score: 0,
    streak: 0,
    longestStreak: 0,
    correctCount: 0,
    roundResults: [],
    currentRoundData: rounds[0],
    timeRemaining: rounds[0].timeLimit,
    isGuessLocked: false,
    playerGuess: null,
    showAnswer: false,
  }
}

// Calculate final results
export function calculateFinalResults(state: GameState): FinalResults {
  const accuracy = state.totalRounds > 0
    ? Math.round((state.correctCount / state.totalRounds) * 100)
    : 0

  let rank = 'Novice Observer'
  if (state.score >= 2000) rank = 'Master Detector'
  else if (state.score >= 1500) rank = 'Expert Spotter'
  else if (state.score >= 1000) rank = 'Keen Eye'
  else if (state.score >= 500) rank = 'Sharp Watcher'
  else if (state.score >= 200) rank = 'Casual Player'

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

// Share result text
export function generateShareText(results: FinalResults): string {
  return `🎮 Guess the Fake Results
Score: ${results.score}
Correct: ${results.correctCount}/${results.totalRounds}
Accuracy: ${results.accuracy}%
Longest Streak: ${results.longestStreak}
Rank: ${results.rank}

Can you beat my score?`
}
