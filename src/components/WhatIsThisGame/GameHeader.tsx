"use client";

interface GameHeaderProps {
  score: number;
  totalQuestions: number;
}

export const GameHeader = ({ score, totalQuestions }: GameHeaderProps) => {
  return (
    <header className="flex items-center justify-between w-full mb-2 sm:mb-4">
      <div className="bg-game-primary/80 text-white font-bold py-1.5 px-4 sm:py-2 sm:px-6 rounded-full text-sm sm:text-xl md:text-2xl button-3d backdrop-blur-sm">
        Score: {score}
      </div>
    </header>
  );
};
