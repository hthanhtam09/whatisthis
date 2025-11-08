"use client";

import { GameState } from "@/types/game";
import { GameControls } from "./GameControls";
import { GameHeader } from "./GameHeader";
import { ImageDisplay } from "./ImageDisplay";
import { InputArea } from "./InputArea";
import { TimerBar } from "./TimerBar";

interface GameScreenProps {
  gameState: GameState;
  isLoading: boolean;
  userGuess: string;
  score: number;
  totalQuestions: number;
  soundEnabled: boolean;
  canShowImage: boolean;
  onGuessChange: (value: string) => void;
  onSubmit: () => void;
  onTogglePause: () => void;
  onToggleSound: () => void;
}

export const GameScreen = ({
  gameState,
  isLoading,
  userGuess,
  score,
  totalQuestions,
  soundEnabled,
  canShowImage,
  onGuessChange,
  onSubmit,
  onTogglePause,
  onToggleSound,
}: GameScreenProps) => {
  return (
    <>
      <GameControls
        gameState={gameState}
        soundEnabled={soundEnabled}
        onTogglePause={onTogglePause}
        onToggleSound={onToggleSound}
      />

      <GameHeader score={score} totalQuestions={totalQuestions} />

      <main className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
        <ImageDisplay
          gameState={gameState}
          isLoading={isLoading}
          canShowImage={canShowImage}
        />

        <InputArea
          userGuess={userGuess}
          gameState={gameState}
          onGuessChange={onGuessChange}
          onSubmit={onSubmit}
        />
      </main>

      <TimerBar timeLeft={gameState.timeLeft} />
    </>
  );
};
