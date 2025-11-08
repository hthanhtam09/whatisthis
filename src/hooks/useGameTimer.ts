import { useEffect, useRef } from "react";
import { GameState } from "@/types/game";

interface UseGameTimerProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  soundEnabled: boolean;
  playBeep: (frequency: number, duration: number) => void;
}

export const useGameTimer = ({
  gameState,
  setGameState,
  soundEnabled,
  playBeep,
}: UseGameTimerProps) => {
  const playBeepRef = useRef(playBeep);
  const soundEnabledRef = useRef(soundEnabled);

  // Update refs when values change
  useEffect(() => {
    playBeepRef.current = playBeep;
    soundEnabledRef.current = soundEnabled;
  }, [playBeep, soundEnabled]);

  useEffect(() => {
    // Only start timer when game is playing and not paused
    if (
      gameState.gameStatus !== "playing" ||
      !gameState.isPlaying ||
      gameState.isPaused ||
      gameState.timeLeft <= 0
    ) {
      return;
    }

    const interval = setInterval(() => {
      setGameState((prev) => {
        // Check if still playing and not paused
        if (
          prev.gameStatus !== "playing" ||
          !prev.isPlaying ||
          prev.isPaused ||
          prev.timeLeft <= 0
        ) {
          return prev;
        }

        const newTimeLeft = prev.timeLeft - 1;

        // Play countdown sound for every second
        if (soundEnabledRef.current) {
          // Higher pitch for last 3 seconds
          const frequency =
            newTimeLeft <= 3 ? 1000 + (3 - newTimeLeft) * 200 : 600;
          const duration = newTimeLeft <= 3 ? 0.15 : 0.1;
          playBeepRef.current(frequency, duration);
        }

        if (newTimeLeft === 0) {
          return {
            ...prev,
            timeLeft: 0,
            isPlaying: false,
            gameStatus: "timeout",
          };
        }

        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    gameState.gameStatus,
    gameState.isPlaying,
    gameState.isPaused,
    setGameState,
  ]);
};

