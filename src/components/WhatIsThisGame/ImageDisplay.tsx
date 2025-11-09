"use client";

import { motion } from "framer-motion";
import Lottie from "lottie-react";
import LottieLoading from "@/components/LottieLoading";
import { GameState } from "@/types/game";
import { Button } from "@/components/ui/button";
import timeUpAnimation from "@/assets/time.json";
import correctAnimation from "@/assets/celebration.json";

interface ImageDisplayProps {
  gameState: GameState;
  isLoading: boolean;
  canShowImage: boolean;
  onRefresh: () => void;
}

export const ImageDisplay = ({
  gameState,
  isLoading,
  canShowImage,
  onRefresh,
}: ImageDisplayProps) => {
  return (
    <div className="w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-white/30 rounded-xl input-3d flex items-center justify-center backdrop-blur-md relative overflow-hidden">
      {isLoading ? (
        <LottieLoading />
      ) : gameState.currentImage ? (
        <>
          <motion.img
            key={gameState.currentImage}
            src={gameState.currentImage}
            alt="What is this?"
            className={`w-full h-full object-contain rounded-xl ${
              gameState.isPaused ? "opacity-50" : ""
            }`}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={
              canShowImage
                ? { scale: 1, opacity: 1 }
                : { scale: 0.3, opacity: 0 }
            }
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          />

          {gameState.gameStatus === "correct" && !isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-orange-500/20 rounded-xl flex items-center justify-center backdrop-blur-lg">
              <div className="flex flex-col items-center justify-center">
                <div className="w-48 h-48 sm:w-72 sm:h-72 -mt-4 sm:-mt-8">
                  <Lottie
                    animationData={correctAnimation}
                    loop={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <div className="text-white text-4xl sm:text-7xl font-bold text-center">
                  {gameState.currentAnswer}
                </div>
              </div>
            </div>
          )}

          {gameState.gameStatus === "timeout" && !isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-orange-500/20 rounded-xl flex items-center justify-center backdrop-blur-lg">
              <div className="flex flex-col items-center justify-center">
                <div className="w-48 h-48 sm:w-72 sm:h-72 -mt-4 sm:-mt-8">
                  <Lottie
                    animationData={timeUpAnimation}
                    loop={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <div className="text-white text-4xl sm:text-7xl font-bold text-center">
                  {gameState.currentAnswer}
                </div>
              </div>
            </div>
          )}

          {/* Paused Overlay */}
          {gameState.isPaused && !isLoading && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <div className="text-3xl sm:text-6xl font-bold text-white">
                PAUSED
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4">
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white"
            aria-label="Refresh image"
            tabIndex={0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${isLoading ? "animate-spin" : ""}`}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
};
