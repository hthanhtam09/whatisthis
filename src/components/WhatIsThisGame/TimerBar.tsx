"use client";

import { motion } from "framer-motion";
import { GAME_DURATION } from "@/types/game";

interface TimerBarProps {
  timeLeft: number;
}

export const TimerBar = ({ timeLeft }: TimerBarProps) => {
  const percentage = (timeLeft / GAME_DURATION) * 100;
  const isLowTime = timeLeft <= 3;
  const isWarning = timeLeft <= 5;

  return (
    <footer className="w-full pb-4">
      <div className="w-full max-w-4xl mx-auto h-10 bg-white/20 rounded-full overflow-hidden input-3d backdrop-blur-sm relative shadow-lg border border-white/20">
        {/* Background gradient bar */}
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          initial={false}
          animate={{
            width: `${percentage}%`,
            boxShadow: isLowTime
              ? "0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.3)"
              : isWarning
              ? "0 0 15px rgba(251, 191, 36, 0.6), inset 0 0 15px rgba(251, 191, 36, 0.2)"
              : "0 0 10px rgba(59, 130, 246, 0.4), inset 0 0 10px rgba(59, 130, 246, 0.2)",
          }}
          transition={{
            width: {
              duration: 1,
              ease: "linear",
            },
            boxShadow: {
              duration: 0.3,
            },
          }}
          style={{
            width: `${percentage}%`,
            background: isLowTime
              ? "linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)"
              : isWarning
              ? "linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)"
              : "linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
          }}
        >
          {/* Striped pattern overlay */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255, 255, 255, 0.3) 10px,
                rgba(255, 255, 255, 0.3) 20px
              )`,
              backgroundSize: "28px 28px",
            }}
            animate={{
              backgroundPosition: ["0 0", "28px 28px"],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
          />

          {/* Pulsing effect for low time */}
          {isLowTime && (
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-full"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Warning effect for 5 seconds */}
          {isWarning && !isLowTime && (
            <motion.div
              className="absolute inset-0 bg-yellow-400/10 rounded-full"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      </div>
    </footer>
  );
};
