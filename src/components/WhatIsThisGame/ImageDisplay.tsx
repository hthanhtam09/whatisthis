"use client";

import { motion } from "framer-motion";
import LottieLoading from "@/components/LottieLoading";
import { GameState } from "@/types/game";

interface ImageDisplayProps {
  gameState: GameState;
  isLoading: boolean;
  canShowImage: boolean;
}

export const ImageDisplay = ({
  gameState,
  isLoading,
  canShowImage,
}: ImageDisplayProps) => {
  return (
    <div className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-white/30 rounded-xl input-3d flex items-center justify-center backdrop-blur-md relative overflow-hidden">
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

          {/* Status Overlay */}
          {gameState.gameStatus === "correct" && !isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-blue-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <div className="success-message p-8 text-center">
                <div className="emoji-icon">🎉</div>
                <div className="success-text">AMAZING!</div>
                <div className="answer-text mt-3">
                  {gameState.currentAnswer}
                </div>
              </div>
            </div>
          )}

          {gameState.gameStatus === "timeout" && !isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-orange-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <div className="timeout-message p-8 text-center">
                <div className="emoji-icon">⏰</div>
                <div className="timeout-text">TIME'S UP!</div>
                <div className="answer-text mt-3">
                  The answer was: {gameState.currentAnswer}
                </div>
              </div>
            </div>
          )}

          {/* Paused Overlay */}
          {gameState.isPaused && !isLoading && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <div className="text-6xl font-bold text-white">PAUSED</div>
            </div>
          )}
        </>
      ) : (
        <p className="text-white/80 text-lg font-semibold">
          Blurred 3D Object Image
        </p>
      )}
    </div>
  );
};

