"use client";

import { useEffect, useRef } from "react";
import { GameState } from "@/types/game";

interface InputAreaProps {
  userGuess: string;
  gameState: GameState;
  onGuessChange: (value: string) => void;
  onSubmit: () => void;
}

export const InputArea = ({
  userGuess,
  gameState,
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
    <div className="w-full max-w-lg">
      <input
        ref={inputRef}
        id="guess-input"
        className="input-3d w-full h-16 sm:h-[72px] px-6 rounded-full text-lg sm:text-xl font-medium bg-white text-text-dark placeholder-gray-500/80 focus:outline-none focus:ring-4 focus:ring-game-primary/50 transition-all duration-300 disabled:opacity-50"
        placeholder="Type your guess here... (Press Enter to submit)"
        type="text"
        value={userGuess}
        onChange={(e) => onGuessChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!gameState.isPlaying || gameState.isPaused}
      />
    </div>
  );
};
