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
  hintEnabled: boolean;
  canShowImage: boolean;
  onGuessChange: (value: string) => void;
  onSubmit: () => void;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onToggleHint: () => void;
  onRefresh: () => void;
}

export const GameScreen = ({
  gameState,
  isLoading,
  userGuess,
  score,
  totalQuestions,
  soundEnabled,
  hintEnabled,
  canShowImage,
  onGuessChange,
  onSubmit,
  onTogglePause,
  onToggleSound,
  onToggleHint,
  onRefresh,
}: GameScreenProps) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <GameControls
        gameState={gameState}
        soundEnabled={soundEnabled}
        hintEnabled={hintEnabled}
        onTogglePause={onTogglePause}
        onToggleSound={onToggleSound}
        onToggleHint={onToggleHint}
      />

      <GameHeader score={score} totalQuestions={totalQuestions} />

      <main className="flex-1 flex flex-col items-center justify-center gap-2 sm:gap-8 py-1 sm:py-8 min-h-0">
        <ImageDisplay
          gameState={gameState}
          isLoading={isLoading}
          canShowImage={canShowImage}
          onRefresh={onRefresh}
        />

        <InputArea
          userGuess={userGuess}
          gameState={gameState}
          hintEnabled={hintEnabled}
          onGuessChange={onGuessChange}
          onSubmit={onSubmit}
        />
      </main>

      <div className="flex-shrink-0">
        <TimerBar timeLeft={gameState.timeLeft} />
      </div>
    </div>
  );
};
