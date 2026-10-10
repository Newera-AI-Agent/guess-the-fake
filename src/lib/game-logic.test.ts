import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  initializeGame,
  processGuess,
  processTimeout,
  nextRound,
  calculateFinalResults,
  generateShareText,
  shuffleArray,
  calculatePoints,
  createRounds,
  type GameState,
  type GameImage,
  type RoundData
} from './game-logic'
import type { GameState, GameImage } from './game-logic'

describe('Game Logic', () => {
  describe('shuffleArray', () => {
    it('produces same shuffle with same seed', () => {
      const arr = [1, 2, 3, 4, 5]
      const result1 = shuffleArray([...arr], 42)
      const result2 = shuffleArray([...arr], 42)
      expect(result1).toEqual(result2)
    })

    it('produces different shuffle with different seed', () => {
      const arr = [1, 2, 3, 4, 5]
      const result1 = shuffleArray([...arr], 42)
      const result2 = shuffleArray([...arr], 43)
      expect(result1).not.toEqual(result2)
    })

    it('shuffles array correctly', () => {
      const arr = [1, 2, 3, 4, 5]
      const result = shuffleArray([...arr], 42)
      expect(result.sort()).toEqual(arr)
    })
  })

  describe('createRounds', () => {
    it('creates 10 rounds from 10 images', () => {
      const rounds = createRounds([
        { id: 'r1', src: '/r1.jpg', type: 'real' },
        { id: 'r2', src: '/r2.jpg', type: 'real' },
        { id: 'r3', src: '/r3.jpg', type: 'real' },
        { id: 'r4', src: '/r4.jpg', type: 'real' },
        { id: 'r5', src: '/r5.jpg', type: 'real' },
        { id: 'a1', src: '/a1.jpg', type: 'ai' },
        { id: 'a2', src: '/a2.jpg', type: 'ai' },
        { id: 'a3', src: '/a3.jpg', type: 'ai' },
        { id: 'a4', src: '/a4.jpg', type: 'ai' },
        { id: 'a5', src: '/a5.jpg', type: 'ai' },
      ])
      expect(rounds.length).toBe(10)
      rounds.forEach((round, i) => {
        expect(round.roundNumber).toBe(i + 1)
        expect(round.images.length).toBe(2)
        expect(round.aiIndex).toBeGreaterThanOrEqual(0)
        expect(round.aiIndex).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('calculatePoints', () => {
    it('awards base points for correct answer', () => {
      const points = calculatePoints(5, 10, 0)
      expect(points).toBeGreaterThanOrEqual(100) // Base points
    })

    it('awards speed bonus based on remaining time', () => {
      const pointsFast = calculatePoints(10, 10, 0)
      const pointsSlow = calculatePoints(1, 10, 0)
      expect(pointsFast).toBeGreaterThan(pointsSlow)
    })

    it('applies streak multiplier for consecutive correct answers', () => {
      const pointsStreak0 = calculatePoints(5, 10, 0)
      const pointsStreak1 = calculatePoints(5, 10, 1)
      const pointsStreak2 = calculatePoints(5, 10, 2)
      expect(pointsStreak1).toBeGreaterThan(pointsStreak0)
      expect(pointsStreak2).toBeGreaterThan(pointsStreak1)
    })
  })

  describe('initializeGame', () => {
    it('initializes game with correct default state', () => {
      const state = initializeGame(10)
      expect(state.status).toBe('start')
      expect(state.currentRound).toBe(0)
      expect(state.totalRounds).toBe(10)
      expect(state.score).toBe(0)
      expect(state.streak).toBe(0)
      expect(state.longestStreak).toBe(0)
      expect(state.correctCount).toBe(0)
      expect(state.timeRemaining).toBe(10)
      expect(state.isGuessLocked).toBe(false)
      expect(state.playerGuess).toBeNull()
      expect(state.showAnswer).toBe(false)
      expect(state.roundResults).toEqual([])
      expect(state.currentRoundData).not.toBeNull()
    })
  })

  describe('processGuess', () => {
    it('correctly handles correct guess', () => {
      const baseState = initializeGame(10)
      // Start the game first
      const playingState: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 8,
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
      }

      const result = processGuess(playingState, playingState.currentRoundData!.aiIndex)
      expect(result.showAnswer).toBe(true)
      expect(result.isGuessLocked).toBe(true)
      expect(result.status).toBe('round-result')
      expect(result.roundResults[result.roundResults.length - 1].pointsEarned).toBeGreaterThan(0)
      expect(result.streak).toBe(1)
      expect(result.longestStreak).toBe(1)
      expect(result.correctCount).toBe(1)
    })

    it('correctly handles incorrect guess', () => {
      const baseState = initializeGame(10)
      const playingState: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 8,
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
      }

      const wrongGuess = playingState.currentRoundData!.aiIndex === 0 ? 1 : 0
      const result = processGuess(playingState, wrongGuess)
      expect(result.showAnswer).toBe(true)
      expect(result.isGuessLocked).toBe(true)
      expect(result.status).toBe('round-result')
      expect(result.roundResults[result.roundResults.length - 1].pointsEarned).toBe(0)
      expect(result.streak).toBe(0)
      expect(result.longestStreak).toBe(0)
      expect(result.correctCount).toBe(0)
    })

    it('does not process if guess already locked', () => {
      const baseState = initializeGame(10)
      const playingState: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 8,
        isGuessLocked: true,
        playerGuess: 0,
        showAnswer: true,
      }

      const result = processGuess(playingState, 1)
      expect(result).toBe(playingState)
    })
  })

  describe('processTimeout', () => {
    it('handles timeout correctly', () => {
      const baseState = initializeGame(10)
      const playingState: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 0,
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
      }

      const result = processTimeout(playingState)
      expect(result.showAnswer).toBe(true)
      expect(result.isGuessLocked).toBe(true)
      expect(result.status).toBe('round-result')
      expect(result.roundResults[result.roundResults.length - 1].pointsEarned).toBe(0)
      expect(result.streak).toBe(0)
      expect(result.correctCount).toBe(0)
    })

    it('does not process if already locked', () => {
      const baseState = initializeGame(10)
      const playingState: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 0,
        isGuessLocked: true,
        playerGuess: 0,
        showAnswer: true,
      }

      const result = processTimeout(playingState)
      expect(result).toBe(playingState)
    })
  })

  describe('nextRound', () => {
    it('advances to next round when rounds remain', () => {
      const baseState = initializeGame(10)
      const roundResultState: GameState = {
        ...baseState,
        status: 'round-result',
        currentRound: 1,
        timeRemaining: 10,
        isGuessLocked: true,
        playerGuess: 0,
        showAnswer: true,
        score: 100,
        streak: 1,
        longestStreak: 1,
        correctCount: 1,
        roundResults: [
          { roundNumber: 1, aiIndex: 0, playerGuess: 0, isCorrect: true, timeRemaining: 8, pointsEarned: 100, streakAtRound: 0 }
        ],
      }

      const rounds = createRounds(baseState.currentRoundData!.images.flatMap(img => [img]) as GameImage[], 10)
      const result = nextRound(roundResultState, rounds)
      expect(result.status).toBe('playing')
      expect(result.currentRound).toBe(2)
      expect(result.timeRemaining).toBe(10)
      expect(result.isGuessLocked).toBe(false)
      expect(result.playerGuess).toBeNull()
      expect(result.showAnswer).toBe(false)
      expect(result.currentRoundData).not.toBeNull()
    })

    it('transitions to game-over when all rounds complete', () => {
      const baseState = initializeGame(10)
      const roundResultState: GameState = {
        ...baseState,
        status: 'round-result',
        currentRound: 10,
        timeRemaining: 10,
        isGuessLocked: true,
        playerGuess: 0,
        showAnswer: true,
        score: 1000,
        streak: 10,
        longestStreak: 10,
        correctCount: 10,
        roundResults: Array(10).fill(null).map((_, i) => (
          { roundNumber: i + 1, aiIndex: 0, playerGuess: 0, isCorrect: true, timeRemaining: 8, pointsEarned: 100, streakAtRound: i }
        )),
      }

      const rounds = createRounds(baseState.currentRoundData!.images.flatMap(img => [img]) as GameImage[], 10)
      const result = nextRound(roundResultState, rounds)
      expect(result.status).toBe('game-over')
      expect(result.currentRound).toBe(10)
    })
  })

  describe('calculateFinalResults', () => {
    it('calculates correct final results', () => {
      const baseState = initializeGame(10)
      const gameOverState: GameState = {
        ...baseState,
        status: 'game-over',
        currentRound: 10,
        score: 850,
        streak: 0,
        longestStreak: 3,
        correctCount: 8,
        roundResults: [
          { roundNumber: 1, aiIndex: 0, playerGuess: 0, isCorrect: true, timeRemaining: 8, pointsEarned: 100, streakAtRound: 0 },
          { roundNumber: 2, aiIndex: 1, playerGuess: 1, isCorrect: true, timeRemaining: 9, pointsEarned: 120, streakAtRound: 1 },
          { roundNumber: 3, aiIndex: 0, playerGuess: 1, isCorrect: false, timeRemaining: 0, pointsEarned: 0, streakAtRound: 2 },
          { roundNumber: 4, aiIndex: 1, playerGuess: 1, isCorrect: true, timeRemaining: 7, pointsEarned: 90, streakAtRound: 0 },
          { roundNumber: 5, aiIndex: 0, playerGuess: 0, isCorrect: true, timeRemaining: 6, pointsEarned: 110, streakAtRound: 1 },
          { roundNumber: 6, aiIndex: 1, playerGuess: 1, isCorrect: true, timeRemaining: 8, pointsEarned: 115, streakAtRound: 2 },
          { roundNumber: 7, aiIndex: 0, playerGuess: 1, isCorrect: false, timeRemaining: 0, pointsEarned: 0, streakAtRound: 3 },
          { roundNumber: 8, aiIndex: 1, playerGuess: 1, isCorrect: true, timeRemaining: 5, pointsEarned: 105, streakAtRound: 0 },
          { roundNumber: 9, aiIndex: 0, playerGuess: 1, isCorrect: false, timeRemaining: 0, pointsEarned: 0, streakAtRound: 1 },
          { roundNumber: 10, aiIndex: 1, playerGuess: 1, isCorrect: true, timeRemaining: 4, pointsEarned: 100, streakAtRound: 0 },
        ],
      }

      const results = calculateFinalResults(gameOverState)
      expect(results.score).toBe(850)
      expect(results.correctCount).toBe(8)
      expect(results.totalRounds).toBe(10)
      expect(results.accuracy).toBe(80)
      expect(results.longestStreak).toBe(3)
      expect(results.rank).toBe('Sharp Watcher')
    })

    it('handles perfect score', () => {
      const baseState = initializeGame(10)
      const gameOverState: GameState = {
        ...baseState,
        status: 'game-over',
        currentRound: 10,
        score: 2500,
        streak: 10,
        longestStreak: 10,
        correctCount: 10,
        roundResults: Array(10).fill(null).map((_, i) => (
          { roundNumber: i + 1, aiIndex: 0, playerGuess: 0, isCorrect: true, timeRemaining: 8, pointsEarned: 250, streakAtRound: i }
        )),
      }

      const results = calculateFinalResults(gameOverState)
      expect(results.correctCount).toBe(10)
      expect(results.accuracy).toBe(100)
      expect(results.longestStreak).toBe(10)
      expect(results.rank).toBe('Master Detector')
    })
  })

  describe('generateShareText', () => {
    it('generates share text with results', () => {
      const results = {
        score: 1000,
        correctCount: 8,
        totalRounds: 10,
        longestStreak: 3,
        accuracy: 80,
        rank: 'Keen Eye',
        roundResults: []
      }
      const text = generateShareText(results)
      expect(text).toContain('Guess the Fake Results')
      expect(text).toContain('Score: 1000')
      expect(text).toContain('Correct: 8/10')
      expect(text).toContain('Accuracy: 80%')
      expect(text).toContain('Longest Streak: 3')
      expect(text).toContain('Rank: Keen Eye')
    })
  })

  describe('round progression to game over', () => {
    it('completes 10 rounds then transitions to game-over', () => {
      const baseState = initializeGame(10)
      let state: GameState = { ...baseState, status: 'playing', currentRound: 1 }
      const rounds = createRounds(baseState.currentRoundData!.images.flatMap(img => [img]) as GameImage[], 10)

      // Play 10 rounds correctly
      for (let round = 1; round <= 10; round++) {
        // Process correct guess
        state = processGuess(state, state.currentRoundData!.aiIndex)
        expect(state.status).toBe('round-result')

        if (round < 10) {
          state = nextRound(state, rounds)
          expect(state.status).toBe('playing')
          expect(state.currentRound).toBe(round + 1)
        } else {
          // 10th round should transition to game-over
          state = nextRound(state, rounds)
          expect(state.status).toBe('game-over')
        }
      }

      expect(state.currentRound).toBe(10)
      expect(state.roundResults.length).toBe(10)
    })
  })
})
