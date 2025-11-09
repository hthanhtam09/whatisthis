"use client";

import { useEffect, useRef } from "react";
import { GameState } from "@/types/game";

interface InputAreaProps {
  userGuess: string;
  gameState: GameState;
  hintEnabled: boolean;
  onGuessChange: (value: string) => void;
  onSubmit: () => void;
}

export const InputArea = ({
  userGuess,
  gameState,
  hintEnabled,
  onGuessChange,
  onSubmit,
}: InputAreaProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when a new question starts
  useEffect(() => {
    if (gameState.isPlaying && gameState.currentImage && !gameState.isPaused) {
      // Small delay to ensure the input is enabled
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [gameState.isPlaying, gameState.currentImage, gameState.isPaused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      userGuess.trim() &&
      gameState.isPlaying &&
      !gameState.isPaused
    ) {
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-lg px-2 sm:px-0">
      <input
        ref={inputRef}
        id="guess-input"
        className="input-3d w-full h-12 sm:h-[72px] px-4 sm:px-6 rounded-full text-base sm:text-xl font-medium bg-white text-text-dark placeholder-gray-500/80 focus:outline-none focus:ring-4 focus:ring-game-primary/50 transition-all duration-300 disabled:opacity-50"
        placeholder="Type your guess here.."
        type="text"
        value={userGuess}
        onChange={(e) => onGuessChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!gameState.isPlaying || gameState.isPaused}
      />
      {gameState.showHint && gameState.currentHint && hintEnabled && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800 mb-1">💡 Hint:</p>
          <p className="text-sm text-yellow-700">{gameState.currentHint}</p>
        </div>
      )}
    </div>
  );
};
