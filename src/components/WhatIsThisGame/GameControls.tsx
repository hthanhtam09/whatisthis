"use client";

import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { GameState } from "@/types/game";

interface GameControlsProps {
  gameState: GameState;
  soundEnabled: boolean;
  onTogglePause: () => void;
  onToggleSound: () => void;
}

export const GameControls = ({
  gameState,
  soundEnabled,
  onTogglePause,
  onToggleSound,
}: GameControlsProps) => {
  return (
    <div className="absolute top-4 right-4 flex gap-2 z-20">
      {gameState.isPlaying && (
        <button
          onClick={onTogglePause}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label={gameState.isPaused ? "Resume" : "Pause"}
        >
          {gameState.isPaused ? (
            <Play className="w-4 h-4" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
        </button>
      )}
      <button
        onClick={onToggleSound}
        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
      >
        {soundEnabled ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

