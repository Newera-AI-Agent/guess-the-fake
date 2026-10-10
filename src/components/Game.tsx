'use client'

import { useState, useEffect, useCallback } from 'react'
import { useReducedMotion, GameProviders, useAnnouncer } from '@/components/Providers'
import { initializeGame, processGuess, processTimeout, nextRound, calculateFinalResults, generateShareText, type GameState } from '@/lib/game-logic'
import type { GameImage } from '@/lib/game-logic'

interface GameProps {
  timeLimit?: number
}

function GameInner({ timeLimit = 10 }: GameProps) {
  const { prefersReducedMotion } = useReducedMotion()
  const { announce } = useAnnouncer()
  const [state, setState] = useState<GameState>(() => initializeGame(timeLimit))

  // Handle guess button click
  const handleGuess = useCallback((index: 0 | 1) => {
    if (state.isGuessLocked) return
    const result = processGuess(state, index)
    setState(result as GameState)
    const isCorrect = result.isCorrect
    const resultText = isCorrect
      ? 'Correct! This is the AI-generated image.'
      : 'Incorrect. The AI-generated image was on the other side.'
    announce(resultText, isCorrect ? 'polite' : 'assertive')
  }, [state, announce])

  // Set up timeout effect while playing
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    if (state.status === 'playing' && state.timeRemaining > 0 && !state.isGuessLocked) {
      timeoutId = setTimeout(() => {
        const result = processTimeout(state)
        setState(result as GameState)
        announce('Time! The AI-generated image was on the other side.', 'assertive')
      }, 1000)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [state.status, state.timeRemaining, state.isGuessLocked, announce])

  // When round result is shown, auto-advance to next round after delay
  useEffect(() => {
    if (state.status !== 'round-result') return

    const delay = prefersReducedMotion ? 300 : 1000
    const timer = setTimeout(() => {
      const next = nextRound(state, [])
      setState(next as GameState)
    }, delay)

    return () => clearTimeout(timer)
  }, [state.status, prefersReducedMotion])

  // Compute final results when game over
  const finalResults = state.status === 'game-over' ? calculateFinalResults(state) : null
  const shareText = finalResults ? generateShareText(finalResults) : ''

  // Format timer display
  const minutes = Math.floor(state.timeRemaining / 60)
  const seconds = state.timeRemaining % 60
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`

  // Render guess buttons
  const renderGuessButtons = () => {
    if (!state.currentRoundData) return null

    return [
      <div key="0" className="relative group">
        <button
          type="button"
          onClick={() => handleGuess(0)}
          className={`${state.isGuessLocked ? 'cursor-not-allowed opacity-50' : 'group transition-colors duration-200'} focus-visible-ring rounded-lg overflow-hidden w-full max-w-md`}
          aria-label={state.isGuessLocked
            ? 'Guess locked'
            : `Guess image 1: ${state.currentRoundData.images[0].credit || 'AI image'}`}
          aria-disabled={state.isGuessLocked}
        >
          <img
            src={state.currentRoundData.images[0].src}
            alt={state.currentRoundData.images[0].credit || 'Game image'}
            className={prefersReducedMotion ? 'transition-none' : 'w-full h-auto object-cover transition-opacity duration-300'}
            loading="lazy"
            width={768}
            height={768}
          />
          {state.showAnswer && state.playerGuess !== null && (
            state.currentRoundData.aiIndex === 0
              ? state.playerGuess === 0
                ? <div className="absolute inset-0 bg-green-500/20 rounded-lg animate-correct-flash"/>
                : <div className="absolute inset-0 bg-red-500/20 rounded-lg animate-incorrect-flash"/>
              : null
          )}
          {state.showAnswer && state.playerGuess !== null && (
            state.currentRoundData.aiIndex === 1
              ? state.playerGuess === 1
                ? <div className="absolute inset-0 bg-green-500/20 rounded-lg animate-correct-flash"/>
                : <div className="absolute inset-0 bg-red-500/20 rounded-lg animate-incorrect-flash"/>
              : null
          )}
        </button>
      </div>,
      <div key="1" className="relative group">
        <button
          type="button"
          onClick={() => handleGuess(1)}
          className={`${state.isGuessLocked ? 'cursor-not-allowed opacity-50' : 'group transition-colors duration-200'} focus-visible-ring rounded-lg overflow-hidden w-full max-w-md`}
          aria-label={state.isGuessLocked
            ? 'Guess locked'
            : `Guess image 2: ${state.currentRoundData.images[1].credit || 'AI image'}`}
          aria-disabled={state.isGuessLocked}
        >
          <img
            src={state.currentRoundData.images[1].src}
            alt={state.currentRoundData.images[1].credit || 'Game image'}
            className={prefersReducedMotion ? 'transition-none' : 'w-full h-auto object-cover transition-opacity duration-300'}
            loading="lazy"
            width={768}
            height={768}
          />
          {state.showAnswer && state.playerGuess !== null && (
            state.currentRoundData.aiIndex === 0
              ? state.playerGuess === 1
                ? <div className="absolute inset-0 bg-red-500/20 rounded-lg animate-incorrect-flash"/>
                : <div className="absolute inset-0 bg-green-500/20 rounded-lg animate-correct-flash"/>
              : null
          )}
          {state.showAnswer && state.playerGuess !== null && (
            state.currentRoundData.aiIndex === 1
              ? state.playerGuess === 1
                ? <div className="absolute inset-0 bg-green-500/20 rounded-lg animate-correct-flash"/>
                : <div className="absolute inset-0 bg-red-500/20 rounded-lg animate-incorrect-flash"/>
              : null
          )}
        </button>
      </div>,
    ]
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Score Area */}
      <header className="p-4 border-b border-dark-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Guess the Fake</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-dark-400">Round {state.currentRound}/{state.totalRounds}</span>
          <span className="text-sm text-dark-400">Score: {state.score}</span>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        {state.status === 'start' && (
          <div className="text-center max-w-2xl">
            <p className="text-dark-400 text-lg mb-4">
              Can you spot the AI-generated image?
            </p>
            <button
              onClick={() => setState(initializeGame(timeLimit))}
              className="inline-block bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors focus-visible-ring"
            >
              Start Game
            </button>
          </div>
        )}
        {state.status === 'playing' && (
          <div className="grid grid-cols-2 gap-6 max-w-4xl w-full items-center justify-center">
            {renderGuessButtons()}
            {state.timeRemaining && (
              <div className="mt-6 text-center col-span-2">
                <p className="text-xl font-medium text-dark-100">Time remaining: {formattedTime}</p>
                <p className="text-sm text-dark-400">{state.timeRemaining} seconds</p>
              </div>
            )}
          </div>
        )}
        {state.status === 'round-result' && (
          <div className="text-center max-w-2xl" role="status" aria-live="polite">
            <p className="text-2xl font-bold mb-2">{state.isCorrect ? 'Correct!' : 'Incorrect'}</p>
            <p className="text-dark-400 mb-4">The AI-generated image was {state.aiIndex === 0 ? 'on the left' : 'on the right'}</p>
            <p className="text-dark-400 mb-6">Points earned: {state.pointsEarned || 0}</p>
            <button
              onClick={() => setState(nextRound(state, []))}
              className="inline-block bg-secondary text-white px-4 py-2 rounded-md font-medium hover:bg-secondary/90 transition-colors focus-visible-ring"
            >{state.currentRound < state.totalRounds ? 'Next Round' : 'View Results'}</button>
          </div>
        )}
        {state.status === 'game-over' && (
          <div className="p-8 text-center max-w-2xl mx-auto" role="status" aria-live="polite">
            <h2 className="text-3xl font-bold mb-4">Game Over</h2>
            <p className="text-2xl font-bold mb-2">{finalResults?.score} points</p>
            <p className="text-dark-400 mb-4">Correct: {finalResults?.correctCount}/{finalResults?.totalRounds}</p>
            <p className="text-dark-400 mb-4">Accuracy: {finalResults?.accuracy}%</p>
            <p className="text-dark-400 mb-6">Longest streak: {finalResults?.longestStreak}</p>
            <button
              onClick={() => setState(initializeGame(timeLimit))}
              className="inline-block bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors focus-visible-ring"
            >
              Play Again
            </button>
            {shareText && (
              <div className="mt-6">
                <button
                  onClick={() => navigator.clipboard.writeText(shareText)}
                  className="inline-block bg-secondary text-white px-4 py-2 rounded-md font-medium hover:bg-secondary/90 transition-colors focus-visible-ring"
                >
                  Copy Result to Share
                </button>
              </div>
            )}
          </div>
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
