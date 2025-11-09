"use client";

import { Play, Pause, Volume2, VolumeX, Lightbulb, LightbulbOff } from "lucide-react";
import { GameState } from "@/types/game";

interface GameControlsProps {
  gameState: GameState;
  soundEnabled: boolean;
  hintEnabled: boolean;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onToggleHint: () => void;
}

export const GameControls = ({
  gameState,
  soundEnabled,
  hintEnabled,
  onTogglePause,
  onToggleSound,
  onToggleHint,
}: GameControlsProps) => {
  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-1.5 sm:gap-2 z-20">
      {gameState.isPlaying && (
        <button
          onClick={onTogglePause}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label={gameState.isPaused ? "Resume" : "Pause"}
        >
          {gameState.isPaused ? (
            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
        </button>
      )}
      <button
        onClick={onToggleSound}
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
      >
        {soundEnabled ? (
          <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
        ) : (
          <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
        )}
      </button>
      <button
        onClick={onToggleHint}
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label={hintEnabled ? "Disable hints" : "Enable hints"}
      >
        {hintEnabled ? (
          <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
        ) : (
          <LightbulbOff className="w-3 h-3 sm:w-4 sm:h-4" />
        )}
      </button>
    </div>
  );
};

