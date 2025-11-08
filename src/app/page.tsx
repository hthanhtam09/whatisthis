"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { GameAnimations } from "@/components/WhatIsThisGame/GameAnimations";
import { FloatingBackground } from "@/components/WhatIsThisGame/FloatingBackground";
import { StartScreen } from "@/components/WhatIsThisGame/StartScreen";
import { GameScreen } from "@/components/WhatIsThisGame/GameScreen";
import { useGameState } from "@/hooks/useGameState";

export default function WhatIsThisGame() {
  const {
    gameState,
    userGuess,
    soundEnabled,
    score,
    totalQuestions,
    isLoading,
    setUserGuess,
    setSoundEnabled,
    startGame,
    togglePause,
    submitGuess,
  } = useGameState();

  const [isTitleAnimating, setIsTitleAnimating] = useState(false);
  const [showGameScreen, setShowGameScreen] = useState(false);
  const [canShowImage, setCanShowImage] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const isIdle = gameState.gameStatus === "idle";
  const showTitleInCenter = isIdle;

  const handleStartGame = () => {
    setIsTitleAnimating(true);
    setCanShowImage(false);
    // Wait for title animation to complete (1s) before showing game screen and image
    setTimeout(() => {
      startGame();
      setShowGameScreen(true);
      setIsTitleAnimating(false);
      // Allow image to show after title animation completes
      setTimeout(() => {
        setCanShowImage(true);
      }, 50); // Small delay to ensure smooth transition
    }, 1000);
  };

  // Reset states when game goes back to idle
  useEffect(() => {
    if (isIdle) {
      setShowGameScreen(false);
      setCanShowImage(false);
    }
  }, [isIdle]);

  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-hidden font-body text-text-light"
      style={{ backgroundColor: "#6A3E9F" }}
    >
      <GameAnimations />
      <FloatingBackground />

      {/* Single Title - moves from center to top using framer-motion */}
      <motion.div
        layoutId="game-title-wrapper"
        initial={false}
        animate={{
          top: showTitleInCenter ? "30%" : "16px",
        }}
        transition={{
          duration: 1,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: showTitleInCenter ? "center" : "flex-start",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <motion.h1
          ref={titleRef}
          className={`font-black leading-tight tracking-tighter bubbly-font text-white ${
            showTitleInCenter || isTitleAnimating
              ? "text-7xl sm:text-8xl md:text-9xl"
              : "text-6xl sm:text-6xl"
          } ${showTitleInCenter ? "animate-glow" : ""} ${
            !showTitleInCenter && !isTitleAnimating ? "animate-pulse" : ""
          }`}
          initial={false}
          animate={{
            scale: showTitleInCenter || isTitleAnimating ? 1 : 0.6,
          }}
          transition={{
            duration: 1,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{
            textAlign: "center",
            padding: 0,
            margin: 0,
            transformOrigin: "center center",
            willChange: "transform",
            whiteSpace: "nowrap",
          }}
        >
          What Is This?
        </motion.h1>
      </motion.div>

      <div className="relative z-10 flex h-full grow flex-col p-4 sm:p-6">
        {isIdle ? (
          showTitleInCenter && (
            <div className="flex flex-1 flex-col items-center justify-center text-center mt-20">
              <div className="flex flex-col items-center gap-12">
                <StartScreen
                  onStart={handleStartGame}
                  isLoading={isLoading}
                  isAnimating={isTitleAnimating}
                />
              </div>
            </div>
          )
        ) : showGameScreen ? (
          <GameScreen
            gameState={gameState}
            isLoading={isLoading}
            userGuess={userGuess}
            score={score}
            totalQuestions={totalQuestions}
            soundEnabled={soundEnabled}
            canShowImage={canShowImage}
            onGuessChange={setUserGuess}
            onSubmit={submitGuess}
            onTogglePause={togglePause}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
          />
        ) : null}
      </div>
    </div>
  );
}
