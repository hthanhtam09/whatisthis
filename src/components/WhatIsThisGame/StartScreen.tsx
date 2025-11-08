"use client";

import { Loader2 } from "lucide-react";
import LottieLoading from "@/components/LottieLoading";

interface StartScreenProps {
  onStart: () => void;
  isLoading: boolean;
  isAnimating: boolean;
}

export const StartScreen = ({
  onStart,
  isLoading,
  isAnimating,
}: StartScreenProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex flex-col items-center gap-12">
        {isLoading ? (
          <div className="mt-8">
            <LottieLoading />
          </div>
        ) : (
          <button
            onClick={onStart}
            disabled={isLoading || isAnimating}
            className="flex min-w-[84px] max-w-[480px] transform cursor-pointer items-center justify-center overflow-hidden rounded-full h-16 px-10 text-xl font-bold leading-normal tracking-wider text-text-dark shadow-lg transition-transform duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-game-primary/50 sm:h-20 sm:px-12 sm:text-2xl bg-gradient-to-br from-game-tertiary via-game-secondary to-game-primary animate-bounce-glow hover:animate-wiggle disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: "3px solid #ffffff",
              boxShadow: "6px 6px 0px #ffffff",
            }}
          >
            <span className="truncate text-white">Start Game</span>
          </button>
        )}
      </div>
    </div>
  );
};
