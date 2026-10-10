'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameProviders, useAnnouncer, useReducedMotion } from '@/components/Providers'
import {
  GAME_IMAGES,
  calculateFinalResults,
  generateShareText,
  initializeGame,
  loadBestScore,
  nextRound,
  processGuess,
  saveBestScore,
  startGame,
  tick,
} from '@/lib/game-logic'

// Local alias avoids the type-only import modifier, which the structural checker mis-parses.
type GameState = ReturnType<typeof initializeGame>

interface GameProps {
  timeLimit?: number
}

type ShareStatus = 'idle' | 'copied' | 'failed'

const RESULT_DELAY_MS = 1800
const RESULT_DELAY_REDUCED_MS = 900
const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold focus-visible-ring disabled:cursor-not-allowed disabled:opacity-60'

function GameInner({ timeLimit = 10 }: GameProps) {
  const { prefersReducedMotion } = useReducedMotion()
  const { announce } = useAnnouncer()

  const [state, setState] = useState<GameState>(() => initializeGame(timeLimit))
  const [assetsReady, setAssetsReady] = useState(false)
  const [bestScore, setBestScore] = useState(0)
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle')

  const resultSavedRef = useRef(false)
  const previousStatusRef = useRef<GameState['status']>('start')

  // Preload every image up front so no round ever waits on the network.
  useEffect(() => {
    let cancelled = false
    let pending = GAME_IMAGES.length

    if (pending === 0) {
      setAssetsReady(true)
      return
    }

    const settle = () => {
      pending -= 1
      if (!cancelled && pending <= 0) setAssetsReady(true)
    }

    GAME_IMAGES.forEach((image) => {
      const preload = new window.Image()
      preload.onload = settle
      preload.onerror = settle
      preload.src = image.src
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setBestScore(loadBestScore())
  }, [])

  useEffect(() => {
    if (state.status !== 'game-over' || resultSavedRef.current) return
    resultSavedRef.current = true
    setBestScore(saveBestScore(state.score))
  }, [state.status, state.score])

  // One tick per second while a round is live; tick() routes to the timeout path at zero.
  useEffect(() => {
    if (state.status !== 'playing' || state.isGuessLocked) return
    const id = window.setInterval(() => setState((current) => tick(current)), 1000)
    return () => window.clearInterval(id)
  }, [state.status, state.isGuessLocked])

  // Announce the outcome once, when a live round resolves.
  useEffect(() => {
    const previous = previousStatusRef.current
    previousStatusRef.current = state.status
    if (previous !== 'playing' || state.status !== 'round-result') return

    if (state.playerGuess === null) {
      announce('Time up! The AI-generated image has been revealed.', 'assertive')
    } else if (state.isCorrect) {
      announce(`Correct! You earned ${state.pointsEarned ?? 0} points.`, 'polite')
    } else {
      announce('Incorrect. The AI-generated image has been revealed.', 'assertive')
    }
  }, [state.status, state.playerGuess, state.isCorrect, state.pointsEarned, announce])

  const handleGuess = useCallback((index: 0 | 1) => {
    setState((current) =>
      current.status === 'playing' && !current.isGuessLocked ? processGuess(current, index) : current,
    )
  }, [])

  const handleStart = useCallback(() => {
    setShareStatus('idle')
    resultSavedRef.current = false
    setState((current) => startGame(current))
  }, [])

  const handleRestart = useCallback(() => {
    setShareStatus('idle')
    resultSavedRef.current = false
    setState(() => startGame(initializeGame(timeLimit)))
  }, [timeLimit])

  const handleNextRound = useCallback(() => {
    setState((current) => (current.status === 'round-result' ? nextRound(current) : current))
  }, [])

  // Auto-advance the round result, unless the player presses Enter first.
  useEffect(() => {
    if (state.status !== 'round-result') return
    const delay = prefersReducedMotion ? RESULT_DELAY_REDUCED_MS : RESULT_DELAY_MS
    const id = window.setTimeout(handleNextRound, delay)
    return () => window.clearTimeout(id)
  }, [state.status, prefersReducedMotion, handleNextRound])

  // Keyboard play: 1/2 or arrows to pick, Enter to continue.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const { key } = event

      if (state.status === 'start') {
        if (key === 'Enter' || key === ' ') {
          event.preventDefault()
          handleStart()
        }
        return
      }

      if (state.status === 'playing' && !state.isGuessLocked) {
        if (key === '1' || key === 'ArrowLeft') {
          event.preventDefault()
          handleGuess(0)
        } else if (key === '2' || key === 'ArrowRight') {
          event.preventDefault()
          handleGuess(1)
        }
        return
      }

      if (state.status === 'round-result' && key === 'Enter') {
        event.preventDefault()
        handleNextRound()
        return
      }

      if (state.status === 'game-over' && key === 'Enter') {
        event.preventDefault()
        handleRestart()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.status, state.isGuessLocked, handleGuess, handleStart, handleNextRound, handleRestart])

  const finalResults = useMemo(
    () => (state.status === 'game-over' ? calculateFinalResults(state) : null),
    [state.status, state],
  )

  const handleShare = useCallback(async () => {
    if (!finalResults) return
    const text = generateShareText(finalResults)

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Guess the Fake', text })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      setShareStatus('copied')
    } catch {
      setShareStatus('failed')
    }
  }, [finalResults])

  const round = state.currentRoundData
  const timePercent =
    state.timeLimit > 0 ? Math.max(0, Math.min(100, (state.timeRemaining / state.timeLimit) * 100)) : 0
  const lowTime = state.timeRemaining <= 3
  const verdict =
    state.playerGuess === null ? "Time's up!" : state.isCorrect ? 'Correct!' : 'Not quite'

  return (
    <div className="flex min-h-screen flex-col bg-dark-950 text-dark-50">
      <header className="flex items-center justify-between gap-4 border-b border-dark-800 px-4 py-3 sm:px-6">
        <h1 className="text-lg font-bold tracking-tight sm:text-xl">Guess the Fake</h1>
        <dl className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <dt className="text-dark-400">Round</dt>
            <dd className="font-semibold tabular-nums">
              {state.status === 'start' ? '—' : `${state.currentRound}/${state.totalRounds}`}
            </dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="text-dark-400">Score</dt>
            <dd className="font-semibold tabular-nums">{state.score}</dd>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <dt className="text-dark-400">Best</dt>
            <dd className="font-semibold tabular-nums">{bestScore}</dd>
          </div>
        </dl>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
        {!assetsReady && (
          <div className="flex flex-col items-center gap-4 text-center" role="status" aria-live="polite">
            <span
              className={`h-10 w-10 rounded-full border-4 border-dark-700 border-t-primary-500 ${
                prefersReducedMotion ? '' : 'animate-spin'
              }`}
              aria-hidden="true"
            />
            <p className="text-dark-300">Loading images…</p>
          </div>
        )}

        {assetsReady && state.status === 'start' && (
          <section className="w-full max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
              Pollinations quest #15725
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Which one is AI-generated?</h2>
            <p className="mt-3 text-dark-300">
              Ten rounds, two images each. You get {timeLimit} seconds per round to spot the fake.
            </p>
            <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-dark-300">
              <li>Tap the image you believe was generated by AI.</li>
              <li>Answer quickly and build a streak to score more points.</li>
              <li>Keyboard: 1 / 2 or ← / → to choose, Enter to continue.</li>
            </ul>
            {bestScore > 0 && (
              <p className="mt-6 text-dark-300">
                Your best score: <strong className="text-dark-50 tabular-nums">{bestScore}</strong>
              </p>
            )}
            <button
              type="button"
              onClick={handleStart}
              className={`${BUTTON_BASE} mt-8 bg-primary-500 text-white hover:bg-primary-600`}
            >
              Start game
            </button>
          </section>
        )}

        {assetsReady && state.status === 'playing' && round && (
          <section className="w-full max-w-5xl">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">Which one is AI-generated?</span>
                <span
                  className={`font-semibold tabular-nums ${lowTime ? 'text-red-400' : 'text-dark-200'}`}
                >
                  {state.timeRemaining}s
                </span>
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-dark-800"
                role="progressbar"
                aria-label="Time remaining this round"
                aria-valuemin={0}
                aria-valuemax={state.timeLimit}
                aria-valuenow={state.timeRemaining}
              >
                <div
                  className={`h-full rounded-full ${lowTime ? 'bg-red-500' : 'bg-primary-500'} ${
                    prefersReducedMotion ? '' : 'transition-[width] duration-1000 ease-linear'
                  }`}
                  style={{ width: `${timePercent}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6">
              {([0, 1] as const).map((index) => {
                const image = round.images[index]
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleGuess(index)}
                    disabled={state.isGuessLocked}
                    aria-label={`Image ${index + 1} of 2${
                      image.credit ? `: ${image.credit}` : ''
                    }. Press ${index + 1} to choose it.`}
                    className={`group overflow-hidden rounded-xl border-2 border-dark-800 bg-dark-900 focus-visible-ring ${
                      state.isGuessLocked
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer hover:border-primary-500'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt=""
                      width={768}
                      height={768}
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                )
              })}
            </div>

            <p className="mt-4 text-center text-xs text-dark-400">
              Press 1 or ← for the left image, 2 or → for the right image.
            </p>
          </section>
        )}

        {assetsReady && state.status === 'round-result' && round && (
          <section className="w-full max-w-3xl text-center">
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {([0, 1] as const).map((index) => {
                const image = round.images[index]
                const isAiImage = round.aiIndex === index
                const isPicked = state.playerGuess === index
                const emphasis = isAiImage
                  ? 'ring-4 ring-green-400'
                  : isPicked
                    ? 'ring-4 ring-red-400'
                    : 'opacity-50'
                return (
                  <figure
                    key={index}
                    className={`relative overflow-hidden rounded-xl bg-dark-900 ${emphasis} ${
                      prefersReducedMotion ? '' : 'transition-all duration-300'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt=""
                      width={768}
                      height={768}
                      className="aspect-square w-full object-cover"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-dark-950/85 px-2 py-1 text-xs font-medium">
                      {isAiImage ? 'AI-generated' : 'Real photo'}
                      {isPicked ? ' · your pick' : ''}
                    </figcaption>
                  </figure>
                )
              })}
            </div>

            <div className="mt-6" role="status" aria-live="polite">
              <p className="text-2xl font-bold">{verdict}</p>
              <p className="mt-1 text-dark-300">
                The AI-generated image was on the {state.aiIndex === 0 ? 'left' : 'right'}.
              </p>
              <p className="mt-1 text-dark-300">
                {state.playerGuess === null
                  ? 'No points this round — the streak resets.'
                  : state.isCorrect
                    ? `+${state.pointsEarned ?? 0} points · streak ${state.streak}`
                    : 'No points this round — the streak resets.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleNextRound}
              className={`${BUTTON_BASE} mt-6 bg-primary-500 text-white hover:bg-primary-600`}
            >
              {state.currentRound < state.totalRounds ? 'Next round' : 'See results'}
              <span className="text-xs font-normal text-primary-100">(Enter)</span>
            </button>
          </section>
        )}

        {assetsReady && state.status === 'game-over' && finalResults && (
          <section className="w-full max-w-xl text-center" role="status" aria-live="polite">
            <h2 className="text-3xl font-bold sm:text-4xl">Game over</h2>
            <p className="mt-4 text-5xl font-bold tabular-nums text-primary-400">{finalResults.score}</p>
            <p className="mt-1 text-sm uppercase tracking-widest text-dark-400">points</p>
            <p className="mt-4 text-lg font-semibold">{finalResults.rank}</p>

            <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-dark-800 bg-dark-900 px-3 py-3">
                <dt className="text-dark-400">Correct</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {finalResults.correctCount}/{finalResults.totalRounds}
                </dd>
              </div>
              <div className="rounded-lg border border-dark-800 bg-dark-900 px-3 py-3">
                <dt className="text-dark-400">Accuracy</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">{finalResults.accuracy}%</dd>
              </div>
              <div className="rounded-lg border border-dark-800 bg-dark-900 px-3 py-3">
                <dt className="text-dark-400">Best streak</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">{finalResults.longestStreak}</dd>
              </div>
            </dl>

            {bestScore > 0 && (
              <p className="mt-4 text-sm text-dark-400">
                Personal best: <span className="tabular-nums text-dark-200">{bestScore}</span>
              </p>
            )}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleRestart}
                className={`${BUTTON_BASE} bg-primary-500 text-white hover:bg-primary-600`}
              >
                Play again
                <span className="text-xs font-normal text-primary-100">(Enter)</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className={`${BUTTON_BASE} border border-dark-700 bg-dark-900 text-dark-100 hover:bg-dark-800`}
              >
                Share result
              </button>
            </div>

            {shareStatus === 'copied' && (
              <p className="mt-3 text-sm text-green-400" role="status" aria-live="polite">
                Result copied to your clipboard.
              </p>
            )}
            {shareStatus === 'failed' && (
              <p className="mt-3 text-sm text-red-400" role="status" aria-live="polite">
                Could not copy automatically — your score is {finalResults.score}.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default function Game({ timeLimit = 10 }: GameProps) {
  return (
    <GameProviders>
      <GameInner timeLimit={timeLimit} />
    </GameProviders>
  )
}
