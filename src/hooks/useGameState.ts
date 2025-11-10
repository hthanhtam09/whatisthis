import { useState, useEffect, useCallback, useRef } from "react";
import { GameState, GAME_DURATION } from "@/types/game";
import { useGameQuestion } from "./useGameQuestion";
import { useGameTimer } from "./useGameTimer";
import { useGameSounds } from "./useGameSounds";
import { createFireworks } from "@/components/WhatIsThisGame/Fireworks";
import {
  getUsedWordsFromStorage,
  saveUsedWordsToStorage,
  addUsedWordToStorage,
} from "@/utils/usedWordsStorage";

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentImage: "",
    currentAnswer: "",
    currentHint: "",
    timeLeft: GAME_DURATION,
    isPlaying: false,
    isPaused: false,
    showHint: false,
    gameStatus: "idle",
  });

  const [userGuess, setUserGuess] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hintEnabled, setHintEnabled] = useState(true);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);
  // Load used words from localStorage on mount
  const [usedWordsInSession, setUsedWordsInSession] = useState<Set<string>>(
    () => {
      if (typeof window !== "undefined") {
        return getUsedWordsFromStorage();
      }
      return new Set();
    }
  );
  const usedWordsRef = useRef<Set<string>>(new Set());

  // Keep ref in sync with state
  useEffect(() => {
    usedWordsRef.current = usedWordsInSession;
  }, [usedWordsInSession]);

  // Save to localStorage whenever usedWordsInSession changes
  useEffect(() => {
    if (usedWordsInSession.size > 0) {
      saveUsedWordsToStorage(usedWordsInSession);
    }
  }, [usedWordsInSession]);

  // Reset incorrect guesses when a new question starts
  useEffect(() => {
    if (gameState.currentImage && gameState.isPlaying) {
      setIncorrectGuesses(0);
      setGameState((prev) => ({
        ...prev,
        showHint: false,
      }));
    }
  }, [gameState.currentImage, gameState.isPlaying]);

  const { generateNewQuestion, isLoading } = useGameQuestion();
  const { playBeep } = useGameSounds(soundEnabled);

  const handleGenerateQuestion = useCallback(() => {
    // Reset incorrect guesses count when starting a new question
    setIncorrectGuesses(0);
    generateNewQuestion(
      setGameState,
      usedWordsRef.current,
      setUsedWordsInSession
    );
  }, [generateNewQuestion]);

  useGameTimer({
    gameState,
    setGameState,
    soundEnabled,
    playBeep,
  });

  // Auto-continue on timeout
  useEffect(() => {
    if (gameState.gameStatus === "timeout") {
      // Update score: -5 points for timeout
      setScore((prev) => {
        const newScore = Math.max(0, prev - 5);
        return newScore;
      });
      setTotalQuestions((prev) => prev + 1);

      // Mark current word as used
      const currentAnswer = gameState.currentAnswer.toLowerCase();
      setUsedWordsInSession((prev) => {
        const newSet = new Set(prev);
        newSet.add(currentAnswer);
        addUsedWordToStorage(currentAnswer);
        return newSet;
      });

      const timeoutId = setTimeout(() => {
        handleGenerateQuestion();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [gameState.gameStatus, gameState.currentAnswer, handleGenerateQuestion]);

  // Auto-continue on correct answer
  useEffect(() => {
    if (gameState.gameStatus === "correct") {
      const timeoutId = setTimeout(() => {
        handleGenerateQuestion();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [gameState.gameStatus, handleGenerateQuestion]);

  const startGame = useCallback(() => {
    // Only reset if game is actually in idle state (starting fresh)
    // Note: We don't clear used words from localStorage when starting a new game
    // This ensures words don't repeat even after page reload
    if (gameState.gameStatus === "idle") {
      // Keep used words from localStorage, don't reset them
      setScore(0);
      setTotalQuestions(0);
    }
    handleGenerateQuestion();
  }, [gameState.gameStatus, handleGenerateQuestion, score]);

  const togglePause = () => {
    setGameState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const toggleHint = () => {
    setHintEnabled((prev) => !prev);
  };

  const submitGuess = () => {
    if (!userGuess.trim() || !gameState.isPlaying) return;

    const normalizedGuess = userGuess.toLowerCase().trim();
    const normalizedAnswer = gameState.currentAnswer.toLowerCase().trim();

    if (normalizedGuess === normalizedAnswer) {
      // Play success sound
      if (soundEnabled) {
        playBeep(1000, 0.2);
        setTimeout(() => playBeep(1200, 0.2), 200);
      }

      // Create fireworks celebration
      createFireworks(soundEnabled);

      // Update score: points based on remaining time (e.g., 8s left = +8 points)
      const pointsEarned = gameState.timeLeft;
      setScore((prev) => {
        const newScore = prev + pointsEarned;

        return newScore;
      });
      setTotalQuestions((prev) => prev + 1);

      // Mark current word as used
      const currentAnswer = gameState.currentAnswer.toLowerCase();
      setUsedWordsInSession((prev) => {
        const newSet = new Set(prev);
        newSet.add(currentAnswer);
        addUsedWordToStorage(currentAnswer);
        return newSet;
      });

      setGameState((prev) => ({
        ...prev,
        isPlaying: false,
        gameStatus: "correct",
        showHint: false,
      }));
      // Reset incorrect guesses when answer is correct
      setIncorrectGuesses(0);

      // Auto-load next question after 2 seconds (longer to enjoy fireworks)
      // This is handled by the useEffect above
    } else {
      // Wrong answer: no score change, no question count change
      // Player can keep trying until time runs out or they answer correctly
      // Only 2 cases affect score:
      // 1. Correct answer: +points based on time left
      // 2. Timeout: -5 points
      // Play wrong sound and shake input
      if (soundEnabled) {
        playBeep(300, 0.3);
      }

      // Add shake animation to input
      const inputElement = document.getElementById("guess-input");
      if (inputElement) {
        inputElement.classList.add("animate-shake");
        setTimeout(() => {
          inputElement.classList.remove("animate-shake");
        }, 500);
      }

      // Increment incorrect guesses count
      setIncorrectGuesses((prev) => {
        const newCount = prev + 1;
        // Show hint after 3 incorrect guesses
        if (newCount >= 3) {
          setGameState((prevState) => ({
            ...prevState,
            showHint: true,
          }));
        }
        return newCount;
      });
    }

    setUserGuess("");
  };

  const handleRefresh = useCallback(() => {
    handleGenerateQuestion();
  }, [handleGenerateQuestion]);

  return {
    gameState,
    userGuess,
    soundEnabled,
    hintEnabled,
    score,
    totalQuestions,
    isLoading,
    setUserGuess,
    setSoundEnabled,
    startGame,
    togglePause,
    toggleHint,
    submitGuess,
    handleRefresh,
  };
};
