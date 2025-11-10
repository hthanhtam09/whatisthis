"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GameHeaderProps {
  score: number;
  totalQuestions: number;
}

export const GameHeader = ({ score, totalQuestions }: GameHeaderProps) => {
  const [prevScore, setPrevScore] = useState(score);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const scoreRef = useRef<HTMLDivElement>(null);
  const scoreValueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (score !== prevScore) {
      const change = score - prevScore;
      setScoreChange(change);
      setIsAnimating(true);

      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setScoreChange(null);
        setPrevScore(score);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [score, prevScore]);

  const isPositive = scoreChange !== null && scoreChange > 0;
  const changeText =
    scoreChange !== null ? `${isPositive ? "+" : ""}${scoreChange}` : "";

  return (
    <header className="flex items-center justify-between w-full mb-2 sm:mb-4">
      <div
        ref={scoreRef}
        className="relative bg-game-primary/80 text-white font-bold py-1.5 px-4 sm:py-2 sm:px-6 rounded-full text-sm sm:text-xl md:text-2xl button-3d backdrop-blur-sm overflow-visible"
      >
        <span className="relative z-10">Score: </span>
        <span ref={scoreValueRef} className="relative z-10 inline-block">
          <AnimatePresence mode="wait">
            <motion.span
              key={score}
              initial={{ scale: 0.8, opacity: 0, y: -10 }}
              animate={{
                scale: isAnimating ? [0.8, 1.4, 1] : 1,
                opacity: 1,
                y: 0,
              }}
              exit={{ scale: 0.6, opacity: 0, y: 10 }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="inline-block"
            >
              {score}
            </motion.span>
          </AnimatePresence>
        </span>

        {/* Score change indicator */}
        <AnimatePresence>
          {scoreChange !== null && isAnimating && (
            <motion.div
              initial={{
                x: 50,
                y: 0,
                opacity: 0,
                scale: 0.6,
                rotate: isPositive ? -5 : 5,
              }}
              animate={{
                x: 5,
                y: [0, -5, 0],
                opacity: [0, 1, 1, 0.8, 0],
                scale: [0.6, 1.4, 1.2, 1, 0.4],
                rotate: [isPositive ? -5 : 5, 0, 0, 0],
              }}
              exit={{
                opacity: 0,
                scale: 0.2,
                x: 0,
                y: 0,
              }}
              transition={{
                duration: 0.9,
                ease: [0.34, 1.56, 0.64, 1],
                times: [0, 0.2, 0.5, 0.8, 1],
              }}
              className={`absolute top-1/2 -translate-y-1/2 right-0 font-bold text-lg sm:text-2xl md:text-3xl whitespace-nowrap pointer-events-none ${
                isPositive ? "text-green-300" : "text-red-300"
              }`}
              style={{
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                zIndex: 20,
                textShadow: `0 0 15px ${
                  isPositive
                    ? "rgba(34, 197, 94, 0.8)"
                    : "rgba(239, 68, 68, 0.8)"
                }`,
              }}
            >
              {changeText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
