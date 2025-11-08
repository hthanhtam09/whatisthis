"use client";

interface GameHeaderProps {
  score: number;
  totalQuestions: number;
}

export const GameHeader = ({ score, totalQuestions }: GameHeaderProps) => {
  return (
    <header className="flex items-center justify-between w-full mb-4">
      <div className="bg-game-primary/80 text-white font-bold py-2 px-6 rounded-full text-xl sm:text-2xl button-3d backdrop-blur-sm">
        Score: {score}
      </div>
    </header>
  );
};
