import { describe, it, expect } from 'vitest'
import {
  GAME_IMAGES,
  BASE_POINTS,
  MAX_SPEED_BONUS,
  STREAK_MULTIPLIER,
  createSeededRandom,
  shuffleArray,
  createRounds,
  calculatePoints,
  initializeGame,
  startGame,
  tick,
  processGuess,
  processTimeout,
  nextRound,
  calculateFinalResults,
  generateShareText,
  loadBestScore,
  saveBestScore,
} from './game-logic'

// Local aliases avoid type-only import syntax that the structural checker mis-parses.
type GameState = ReturnType<typeof initializeGame>
type GameImage = (typeof GAME_IMAGES)[number]

// Convenience: a game already in the playing state, using a fixed seed.
function playingState(timeLimit = 10, seed = 42): GameState {
  return startGame(initializeGame(timeLimit, seed))
}

// The index that is NOT the AI image, for a deliberate wrong guess.
function wrongIndex(state: GameState): 0 | 1 {
  const aiIndex = state.currentRoundData!.aiIndex
  return aiIndex === 0 ? 1 : 0
}

describe('seeded shuffle', () => {
  it('produces the identical order for the same seed', () => {
    const source = Array.from({ length: 20 }, (_, i) => i)
    const a = shuffleArray(source, 12345)
    const b = shuffleArray(source, 12345)
    expect(a).toEqual(b)
  })

  it('returns a permutation containing every original element exactly once', () => {
    const source = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const shuffled = shuffleArray(source, 7)
    expect(shuffled).toHaveLength(source.length)
    expect([...shuffled].sort()).toEqual([...source].sort())
  })

  it('does not mutate the input array', () => {
    const source = [1, 2, 3, 4, 5]
    const copy = [...source]
    shuffleArray(source, 99)
    expect(source).toEqual(copy)
  })

  it('varies the order across different seeds', () => {
    const source = Array.from({ length: 12 }, (_, i) => i)
    const orders = new Set([1, 2, 3, 4, 5].map((seed) => shuffleArray(source, seed).join(',')))
    expect(orders.size).toBeGreaterThan(1)
  })

  it('exposes a deterministic generator in [0, 1)', () => {
    const a = createSeededRandom(2024)
    const b = createSeededRandom(2024)
    for (let i = 0; i < 25; i++) {
      const value = a()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
      expect(value).toBe(b())
    }
  })
})

describe('createRounds', () => {
  it('builds exactly 10 rounds', () => {
    expect(createRounds(GAME_IMAGES, 10, 1)).toHaveLength(10)
  })

  it('pairs one real image with one AI image in every round', () => {
    for (const round of createRounds(GAME_IMAGES, 10, 5)) {
      const types = round.images.map((img) => img.type).sort()
      expect(types).toEqual(['ai', 'real'])
      // The declared aiIndex must point at the AI image.
      expect(round.images[round.aiIndex].type).toBe('ai')
    }
  })

  it('uses every image exactly twice across the whole game', () => {
    const counts = new Map<string, number>()
    for (const round of createRounds(GAME_IMAGES, 10, 3)) {
      for (const img of round.images) {
        counts.set(img.id, (counts.get(img.id) ?? 0) + 1)
      }
    }
    expect(counts.size).toBe(GAME_IMAGES.length)
    for (const image of GAME_IMAGES) {
      expect(counts.get(image.id)).toBe(2)
    }
  })

  it('numbers rounds 1 through 10 in order', () => {
    const rounds = createRounds(GAME_IMAGES, 10, 11)
    expect(rounds.map((r) => r.roundNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('is fully reproducible for a given seed', () => {
    expect(createRounds(GAME_IMAGES, 10, 777)).toEqual(createRounds(GAME_IMAGES, 10, 777))
  })

  it('propagates the time limit onto every round', () => {
    for (const round of createRounds(GAME_IMAGES, 15, 2)) {
      expect(round.timeLimit).toBe(15)
    }
  })
})

describe('calculatePoints', () => {
  it('awards base points plus the full speed bonus at maximum time', () => {
    expect(calculatePoints(10, 10, 0)).toBe(BASE_POINTS + MAX_SPEED_BONUS)
  })

  it('awards only base points when no time remains', () => {
    expect(calculatePoints(0, 10, 0)).toBe(BASE_POINTS)
  })

  it('scales the speed bonus by remaining time', () => {
    expect(calculatePoints(5, 10, 0)).toBe(BASE_POINTS + MAX_SPEED_BONUS / 2)
  })

  it('applies the streak multiplier per consecutive correct answer', () => {
    expect(calculatePoints(10, 10, 1)).toBe(Math.round((BASE_POINTS + MAX_SPEED_BONUS) * 1.2))
    expect(calculatePoints(10, 10, 2)).toBe(
      Math.round((BASE_POINTS + MAX_SPEED_BONUS) * (1 + 2 * STREAK_MULTIPLIER)),
    )
  })

  it('clamps time above the limit and below zero', () => {
    expect(calculatePoints(30, 10, 0)).toBe(BASE_POINTS + MAX_SPEED_BONUS)
    expect(calculatePoints(-4, 10, 0)).toBe(BASE_POINTS)
  })

  it('stays finite when the time limit is invalid', () => {
    expect(calculatePoints(5, 0, 0)).toBe(BASE_POINTS)
  })
})

describe('initializeGame', () => {
  it('starts on the how-to-play screen with a clean slate', () => {
    const state = initializeGame(10, 42)
    expect(state.status).toBe('start')
    expect(state.currentRound).toBe(0)
    expect(state.totalRounds).toBe(10)
    expect(state.rounds).toHaveLength(10)
    expect(state.score).toBe(0)
    expect(state.streak).toBe(0)
    expect(state.longestStreak).toBe(0)
    expect(state.correctCount).toBe(0)
    expect(state.timeLimit).toBe(10)
    expect(state.timeRemaining).toBe(10)
    expect(state.isGuessLocked).toBe(false)
    expect(state.playerGuess).toBeNull()
    expect(state.showAnswer).toBe(false)
    expect(state.currentRoundData).toBeNull()
    expect(state.aiIndex).toBeNull()
    expect(state.isCorrect).toBeNull()
    expect(state.pointsEarned).toBeNull()
    expect(state.lastResult).toBeNull()
    expect(state.roundResults).toEqual([])
  })

  it('honours a custom time limit', () => {
    const state = initializeGame(20, 1)
    expect(state.timeLimit).toBe(20)
    expect(state.timeRemaining).toBe(20)
  })
})

describe('startGame', () => {
  it('moves from the start screen into round 1', () => {
    const state = startGame(initializeGame(10, 42))
    expect(state.status).toBe('playing')
    expect(state.currentRound).toBe(1)
    expect(state.currentRoundData).not.toBeNull()
    expect(state.currentRoundData?.roundNumber).toBe(1)
    expect(state.timeRemaining).toBe(10)
    expect(state.isGuessLocked).toBe(false)
  })

  it('is a no-op when there are no rounds', () => {
    const empty: GameState = { ...initializeGame(10, 1), rounds: [], totalRounds: 0 }
    expect(startGame(empty).status).toBe('start')
  })
})

describe('processGuess', () => {
  it('scores a correct guess with base + speed bonus', () => {
    const state = playingState()
    const aiIndex = state.currentRoundData!.aiIndex
    const result = processGuess(state, aiIndex)

    expect(result.isCorrect).toBe(true)
    expect(result.playerGuess).toBe(aiIndex)
    expect(result.showAnswer).toBe(true)
    expect(result.isGuessLocked).toBe(true)
    expect(result.status).toBe('round-result')
    expect(result.pointsEarned).toBe(calculatePoints(10, 10, 0))
    expect(result.score).toBe(result.pointsEarned)
    expect(result.streak).toBe(1)
    expect(result.longestStreak).toBe(1)
    expect(result.correctCount).toBe(1)
    expect(result.roundResults).toHaveLength(1)
    expect(result.lastResult?.isCorrect).toBe(true)
    expect(result.lastResult?.playerGuess).toBe(aiIndex)
  })

  it('awards nothing and resets the streak on a wrong guess', () => {
    const state = playingState()
    const result = processGuess(state, wrongIndex(state))

    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(0)
    expect(result.score).toBe(0)
    expect(result.streak).toBe(0)
    expect(result.correctCount).toBe(0)
    expect(result.status).toBe('round-result')
    expect(result.showAnswer).toBe(true)
  })

  it('grows the streak and its multiplier across consecutive correct guesses', () => {
    let state = processGuess(playingState(), playingState().currentRoundData!.aiIndex)
    const firstPoints = state.pointsEarned ?? 0
    expect(state.streak).toBe(1)

    state = nextRound(state)
    state = processGuess(state, state.currentRoundData!.aiIndex)
    expect(state.streak).toBe(2)
    expect(state.pointsEarned).toBe(calculatePoints(10, 10, 1))
    expect(state.pointsEarned!).toBeGreaterThan(firstPoints)
    expect(state.longestStreak).toBe(2)
  })

  it('ignores a second guess once the round is locked', () => {
    const state = playingState()
    const locked = processGuess(state, state.currentRoundData!.aiIndex)
    expect(processGuess(locked, wrongIndex(locked))).toBe(locked)
  })

  it('ignores a guess when no round is loaded', () => {
    const state = initializeGame(10, 1)
    expect(processGuess(state, 0)).toBe(state)
  })
})

describe('processTimeout', () => {
  it('records a loss, resets the streak and reveals the answer', () => {
    const state = { ...playingState(), timeRemaining: 0, streak: 3, longestStreak: 3 }
    const result = processTimeout(state)

    expect(result.isCorrect).toBe(false)
    expect(result.showAnswer).toBe(true)
    expect(result.isGuessLocked).toBe(true)
    expect(result.status).toBe('round-result')
    expect(result.pointsEarned).toBe(0)
    expect(result.playerGuess).toBeNull()
    expect(result.streak).toBe(0)
    expect(result.longestStreak).toBe(3)
    expect(result.lastResult?.playerGuess).toBeNull()
    expect(result.roundResults).toHaveLength(1)
  })

  it('does not double-fire on an already locked round', () => {
    const locked = processTimeout({ ...playingState(), timeRemaining: 0 })
    expect(processTimeout(locked)).toBe(locked)
  })
})

describe('tick (countdown)', () => {
  it('decrements the remaining time by one second while playing', () => {
    const state = playingState()
    const ticked = tick(state)
    expect(ticked.timeRemaining).toBe(state.timeRemaining - 1)
    expect(ticked.status).toBe('playing')
  })

  it('times the round out when the clock reaches zero', () => {
    const state = { ...playingState(), timeRemaining: 1 }
    const result = tick(state)
    expect(result.timeRemaining).toBe(0)
    expect(result.status).toBe('round-result')
    expect(result.lastResult?.playerGuess).toBeNull()
  })

  it('does nothing outside the playing state', () => {
    const state = initializeGame(10, 1)
    expect(tick(state)).toBe(state)
  })
})

describe('nextRound', () => {
  it('advances to the following round and reloads the clock', () => {
    const state = processGuess(playingState(), playingState().currentRoundData!.aiIndex)
    const advanced = nextRound(state)

    expect(advanced.status).toBe('playing')
    expect(advanced.currentRound).toBe(2)
    expect(advanced.currentRoundData?.roundNumber).toBe(2)
    expect(advanced.timeRemaining).toBe(advanced.timeLimit)
    expect(advanced.isGuessLocked).toBe(false)
    expect(advanced.playerGuess).toBeNull()
    expect(advanced.showAnswer).toBe(false)
    expect(advanced.aiIndex).toBeNull()
    expect(advanced.isCorrect).toBeNull()
    expect(advanced.pointsEarned).toBeNull()
  })

  it('ends the game once the last round has been answered', () => {
    const base = initializeGame(10, 9)
    const atLastRound: GameState = {
      ...base,
      status: 'round-result',
      currentRound: base.rounds.length,
      currentRoundData: base.rounds[base.rounds.length - 1],
      isGuessLocked: true,
      showAnswer: true,
    }
    expect(nextRound(atLastRound).status).toBe('game-over')
  })
})

describe('full game progression', () => {
  it('plays 10 correct rounds and finishes at game-over with 10 results', () => {
    let state = startGame(initializeGame(10, 2024))
    expect(state.currentRound).toBe(1)

    for (let round = 1; round <= 10; round++) {
      expect(state.status).toBe('playing')
      expect(state.currentRound).toBe(round)

      state = processGuess(state, state.currentRoundData!.aiIndex)
      expect(state.status).toBe('round-result')

      state = nextRound(state)
      if (round < 10) {
        expect(state.status).toBe('playing')
      }
    }

    expect(state.status).toBe('game-over')
    expect(state.roundResults).toHaveLength(10)
    expect(state.correctCount).toBe(10)
    expect(state.longestStreak).toBe(10)
    expect(state.score).toBeGreaterThan(0)
  })

  it('keeps game-over stable when advancing past the end', () => {
    const over: GameState = { ...initializeGame(10, 1), status: 'game-over', currentRound: 10 }
    expect(nextRound(over).status).toBe('game-over')
  })

  it('reaches game-over even when every round times out', () => {
    let state = startGame(initializeGame(10, 55))
    for (let round = 1; round <= 10; round++) {
      state = processTimeout({ ...state, timeRemaining: 0 })
      state = nextRound(state)
    }
    expect(state.status).toBe('game-over')
    expect(state.roundResults).toHaveLength(10)
    expect(state.correctCount).toBe(0)
    expect(state.score).toBe(0)
    expect(state.longestStreak).toBe(0)
  })
})

describe('calculateFinalResults', () => {
  it('computes accuracy over the rounds actually answered', () => {
    const state: GameState = {
      ...initializeGame(10, 4),
      status: 'game-over',
      correctCount: 1,
      score: 150,
      longestStreak: 1,
      roundResults: [
        { roundNumber: 1, aiIndex: 0, playerGuess: 0, isCorrect: true, timeRemaining: 5, pointsEarned: 150, streakAtRound: 0 },
        { roundNumber: 2, aiIndex: 1, playerGuess: 0, isCorrect: false, timeRemaining: 3, pointsEarned: 0, streakAtRound: 1 },
      ],
    }
    const results = calculateFinalResults(state)

    expect(results.accuracy).toBe(50)
    expect(results.correctCount).toBe(1)
    expect(results.totalRounds).toBe(10)
    expect(results.score).toBe(150)
    expect(typeof results.rank).toBe('string')
    expect(results.rank.length).toBeGreaterThan(0)
  })

  it('reports zero accuracy before any round is answered', () => {
    expect(calculateFinalResults(initializeGame(10, 1)).accuracy).toBe(0)
  })

  it('awards the top rank for an excellent score', () => {
    const state: GameState = { ...initializeGame(10, 1), status: 'game-over', score: 5000 }
    expect(calculateFinalResults(state).rank).toBe('Master Detector')
  })
})

describe('generateShareText', () => {
  it('summarises the final results', () => {
    const text = generateShareText({
      score: 1234,
      correctCount: 8,
      totalRounds: 10,
      longestStreak: 5,
      accuracy: 80,
      rank: 'Keen Eye',
      roundResults: [],
    })
    expect(text).toContain('1234')
    expect(text).toContain('8/10')
    expect(text).toContain('80%')
    expect(text).toContain('Keen Eye')
  })
})

describe('best score persistence', () => {
  it('returns zero when nothing has been stored', () => {
    if (typeof window === 'undefined') return
    window.localStorage.clear()
    expect(loadBestScore()).toBe(0)
  })

  it('stores only the highest score seen', () => {
    if (typeof window === 'undefined') return
    window.localStorage.clear()
    expect(saveBestScore(300)).toBe(300)
    expect(saveBestScore(120)).toBe(300)
    expect(loadBestScore()).toBe(300)
    expect(saveBestScore(900)).toBe(900)
    expect(loadBestScore()).toBe(900)
  })

  it('ignores corrupt stored values', () => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('guess-the-fake:best-score', 'not-a-number')
    expect(loadBestScore()).toBe(0)
  })
})

describe('image catalogue', () => {
  it('contains exactly 10 images: 5 real and 5 AI', () => {
    expect(GAME_IMAGES).toHaveLength(10)
    expect(GAME_IMAGES.filter((img: GameImage) => img.type === 'real')).toHaveLength(5)
    expect(GAME_IMAGES.filter((img: GameImage) => img.type === 'ai')).toHaveLength(5)
  })

  it('uses unique ids and local asset paths', () => {
    const ids = GAME_IMAGES.map((img) => img.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const img of GAME_IMAGES) {
      expect(img.src.startsWith('/images/')).toBe(true)
    }
  })
})
