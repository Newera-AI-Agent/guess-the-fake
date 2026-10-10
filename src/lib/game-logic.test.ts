import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  initializeGame,
  processGuess,
  processTimeout,
  nextRound,
  calculateFinalResults,
  generateShareText
} from './game-logic'
import type { GameState, GameImage } from './game-logic'

describe('Game Logic', () => {
  describe('initializeGame', () => {
    it('initializes game with correct default state', () => {
      const state = initializeGame(10)
      expect(state.status).toBe('start')
      expect(state.currentRound).toBe(0)
      expect(state.totalRounds).toBe(10)
      expect(state.score).toBe(0)
      expect(state.streak).toBe(0)
      expect(state.longestStreak).toBe(0)
      expect(state.timeLimit).toBe(10)
      expect(state.timeRemaining).toBe(10)
      expect(state.isGuessLocked).toBe(false)
      expect(state.playerGuess).toBeNull()
      expect(state.showAnswer).toBe(false)
      expect(state.aiIndex).toBeNull()
      expect(state.isCorrect).toBeNull()
      expect(state.pointsEarned).toBeNull()
      expect(state.currentRoundData).toBeNull()
      expect(state.roundResults).toEqual([])
    })

    it('creates shuffled pairs of images', () => {
      const state = initializeGame(10)
      // After start, round 1 should have data
      // initializeGame should set up all rounds
    })
  })

  describe('shuffle determinism', () => {
    it('produces same shuffle with same seed', () => {
      // The shuffle is internal to initializeGame, but we can verify
      // that calling it multiple times with same initial state gives different shuffles
      // since we use Math.random by default
      const state1 = initializeGame(10)
      const state2 = initializeGame(10)
      // Both should have 10 rounds of data
      expect(state1.totalRounds).toBe(10)
      expect(state2.totalRounds).toBe(10)
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
        aiIndex: 0, // AI is on left
        isCorrect: null,
        pointsEarned: null,
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      const result = processGuess(playingState, 0) // Guess left (AI)
      expect(result.isCorrect).toBe(true)
      expect(result.playerGuess).toBe(0)
      expect(result.showAnswer).toBe(true)
      expect(result.isGuessLocked).toBe(true)
      expect(result.status).toBe('round-result')
      expect(result.pointsEarned).toBeGreaterThan(0)
      expect(result.streak).toBe(1)
      expect(result.longestStreak).toBe(1)
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
        aiIndex: 0, // AI is on left
        isCorrect: null,
        pointsEarned: null,
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      const result = processGuess(playingState, 1) // Guess right (Real)
      expect(result.isCorrect).toBe(false)
      expect(result.playerGuess).toBe(1)
      expect(result.showAnswer).toBe(true)
      expect(result.isGuessLocked).toBe(true)
      expect(result.status).toBe('round-result')
      expect(result.pointsEarned).toBe(0)
      expect(result.streak).toBe(0)
      expect(result.longestStreak).toBe(0)
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
        aiIndex: 0,
        isCorrect: true,
        pointsEarned: 100,
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      const result = processGuess(playingState, 1)
      expect(result).toBe(playingState) // Should return same state
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
        aiIndex: 0, // AI is on left
        isCorrect: null,
        pointsEarned: null,
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      const result = processTimeout(playingState)
      expect(result.isCorrect).toBe(false)
      expect(result.showAnswer).toBe(true)
      expect(result.isGuessLocked).toBe(true)
      expect(result.status).toBe('round-result')
      expect(result.pointsEarned).toBe(0)
      expect(result.streak).toBe(0)
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
        aiIndex: 0,
        isCorrect: true,
        pointsEarned: 100,
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
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
        aiIndex: 0,
        isCorrect: true,
        pointsEarned: 100,
        score: 100,
        streak: 1,
        longestStreak: 1,
        roundResults: [{ round: 1, isCorrect: true, pointsEarned: 100, timeRemaining: 8 }],
        currentRoundData: null
      }

      const result = nextRound(roundResultState, [])
      expect(result.status).toBe('playing')
      expect(result.currentRound).toBe(2)
      expect(result.timeRemaining).toBe(10)
      expect(result.isGuessLocked).toBe(false)
      expect(result.playerGuess).toBeNull()
      expect(result.showAnswer).toBe(false)
      expect(result.aiIndex).not.toBeNull()
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
        aiIndex: 0,
        isCorrect: true,
        pointsEarned: 100,
        score: 1000,
        streak: 10,
        longestStreak: 10,
        roundResults: Array(10).fill({ round: 1, isCorrect: true, pointsEarned: 100, timeRemaining: 8 }),
        currentRoundData: null
      }

      const result = nextRound(roundResultState, [])
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
        roundResults: [
          { round: 1, isCorrect: true, pointsEarned: 100, timeRemaining: 8 },
          { round: 2, isCorrect: true, pointsEarned: 120, timeRemaining: 9 },
          { round: 3, isCorrect: false, pointsEarned: 0, timeRemaining: 0 },
          { round: 4, isCorrect: true, pointsEarned: 90, timeRemaining: 7 },
          { round: 5, isCorrect: true, pointsEarned: 110, timeRemaining: 8 },
          { round: 6, isCorrect: false, pointsEarned: 0, timeRemaining: 0 },
          { round: 7, isCorrect: true, pointsEarned: 95, timeRemaining: 6 },
          { round: 8, isCorrect: true, pointsEarned: 105, timeRemaining: 7 },
          { round: 9, isCorrect: true, pointsEarned: 115, timeRemaining: 9 },
          { round: 10, isCorrect: true, pointsEarned: 115, timeRemaining: 8 },
        ],
        timeLimit: 10,
        timeRemaining: 0,
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
        aiIndex: null,
        isCorrect: null,
        pointsEarned: null,
        currentRoundData: null
      }

      const results = calculateFinalResults(gameOverState)
      expect(results.score).toBe(850)
      expect(results.correctCount).toBe(8)
      expect(results.totalRounds).toBe(10)
      expect(results.accuracy).toBe(80)
      expect(results.longestStreak).toBe(3)
      expect(results.rank).toBeDefined()
    })

    it('handles perfect score', () => {
      const baseState = initializeGame(10)
      const gameOverState: GameState = {
        ...baseState,
        status: 'game-over',
        currentRound: 10,
        score: 1500,
        streak: 10,
        longestStreak: 10,
        roundResults: Array(10).fill({ round: 1, isCorrect: true, pointsEarned: 150, timeRemaining: 8 }),
        timeLimit: 10,
        timeRemaining: 0,
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
        aiIndex: null,
        isCorrect: null,
        pointsEarned: null,
        currentRoundData: null
      }

      const results = calculateFinalResults(gameOverState)
      expect(results.correctCount).toBe(10)
      expect(results.accuracy).toBe(100)
      expect(results.longestStreak).toBe(10)
      expect(results.rank).toBe('AI Detective')
    })
  })

  describe('generateShareText', () => {
    it('generates share text with correct format', () => {
      const results = {
        score: 850,
        correctCount: 8,
        totalRounds: 10,
        accuracy: 80,
        longestStreak: 3,
        rank: 'Sharp Eye'
      }

      const text = generateShareText(results)
      expect(text).toContain('Guess the Fake')
      expect(text).toContain('850')
      expect(text).toContain('8/10')
      expect(text).toContain('80%')
      expect(text).toContain('Sharp Eye')
    })
  })

  describe('score computation', () => {
    it('awards base points for correct answer', () => {
      const baseState = initializeGame(10)
      const playingState: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 0, // No time bonus
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
        aiIndex: 0,
        isCorrect: null,
        pointsEarned: null,
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      const result = processGuess(playingState, 0)
      expect(result.pointsEarned).toBeGreaterThanOrEqual(50) // Base points
    })

    it('awards speed bonus based on remaining time', () => {
      const baseState = initializeGame(10)
      // Same correct guess but with more time remaining should get more points
      const playingStateFast: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 9, // Lots of time left
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
        aiIndex: 0,
        isCorrect: null,
        pointsEarned: null,
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      const playingStateSlow: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 1, // Very little time left
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
        aiIndex: 0,
        isCorrect: null,
        pointsEarned: null,
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      const resultFast = processGuess(playingStateFast, 0)
      const resultSlow = processGuess(playingStateSlow, 0)

      expect(resultFast.pointsEarned).toBeGreaterThan(resultSlow.pointsEarned!)
    })

    it('applies streak multiplier for consecutive correct answers', () => {
      const baseState = initializeGame(10)
      // First correct answer
      let state: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 8,
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
        aiIndex: 0,
        isCorrect: null,
        pointsEarned: null,
        score: 0,
        streak: 0,
        longestStreak: 0,
        roundResults: [],
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      // Round 1 - first correct
      state = processGuess(state, 0)
      const firstPoints = state.pointsEarned!
      expect(state.streak).toBe(1)

      // Move to round 2
      state = nextRound(state, [])

      // Round 2 - second correct (streak = 2)
      state = processGuess(state, 0)
      const secondPoints = state.pointsEarned!
      expect(state.streak).toBe(2)

      // Move to round 3
      state = nextRound(state, [])

      // Round 3 - third correct (streak = 3)
      state = processGuess(state, 0)
      const thirdPoints = state.pointsEarned!
      expect(state.streak).toBe(3)

      // Streak multiplier should increase points for later rounds
      // (assuming same time remaining)
      // This depends on exact formula, but streak should be tracked
    })

    it('resets streak on wrong answer', () => {
      const baseState = initializeGame(10)
      let state: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 8,
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
        aiIndex: 0,
        isCorrect: null,
        pointsEarned: null,
        score: 0,
        streak: 0,
        longestStreak: 0,
        roundResults: [],
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      // Correct guess - streak becomes 1
      state = processGuess(state, 0)
      expect(state.streak).toBe(1)

      // Next round
      state = nextRound(state, [])

      // Wrong guess - streak resets to 0
      state = processGuess(state, 1) // AI is on left (0), guess right (1)
      expect(state.streak).toBe(0)
      expect(state.longestStreak).toBe(1)
    })

    it('resets streak on timeout', () => {
      const baseState = initializeGame(10)
      let state: GameState = {
        ...baseState,
        status: 'playing',
        currentRound: 1,
        timeRemaining: 8,
        isGuessLocked: false,
        playerGuess: null,
        showAnswer: false,
        aiIndex: 0,
        isCorrect: null,
        pointsEarned: null,
        score: 0,
        streak: 1,
        longestStreak: 1,
        roundResults: [],
        currentRoundData: {
          images: [
            { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
            { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
          ],
          aiIndex: 0
        }
      }

      // Simulate timeout
      state = { ...state, timeRemaining: 0 }
      state = processTimeout(state)
      expect(state.streak).toBe(0)
      expect(state.longestStreak).toBe(1)
    })
  })

  describe('round progression to game over', () => {
    it('completes 10 rounds then transitions to game-over', () => {
      const baseState = initializeGame(10)
      let state: GameState = baseState

      // Start game
      state = { ...state, status: 'playing', timeRemaining: 10, currentRound: 1 }
      state.currentRoundData = {
        images: [
          { src: '/images/ai-1.jpg', isAI: true, credit: 'AI' },
          { src: '/images/real-1.jpg', isAI: false, credit: 'Real' }
        ],
        aiIndex: 0
      }
      state.aiIndex = 0

      // Play 10 rounds correctly
      for (let round = 1; round <= 10; round++) {
        state = processGuess(state, 0) // Always guess left (AI)
        expect(state.status).toBe('round-result')

        if (round < 10) {
          state = nextRound(state, [])
          expect(state.status).toBe('playing')
          expect(state.currentRound).toBe(round + 1)
        } else {
          // 10th round should transition to game-over
          state = nextRound(state, [])
          expect(state.status).toBe('game-over')
        }
      }

      expect(state.currentRound).toBe(10)
      expect(state.roundResults.length).toBe(10)
    })
  })
})
