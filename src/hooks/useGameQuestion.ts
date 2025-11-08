import { useState, useCallback, useRef } from "react";
import { GameState, GAME_DURATION } from "@/types/game";
import {
  getImageFromCache,
  saveImageToCache,
  getRandomCachedWord,
} from "@/lib/imageCache";
import { generateHint } from "@/utils/gameUtils";

export const useGameQuestion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const isGeneratingRef = useRef(false);

  const generateNewQuestion = useCallback(
    async (
      setGameState: React.Dispatch<React.SetStateAction<GameState>>,
      usedWordsInSession: Set<string>,
      setUsedWordsInSession: React.Dispatch<React.SetStateAction<Set<string>>>,
      retryCount: number = 0
    ) => {
      // Prevent multiple simultaneous calls
      if (isGeneratingRef.current && retryCount === 0) {
        return "";
      }

      isGeneratingRef.current = true;
      setIsLoading(true);

      // Clear current image immediately to show loading
      setGameState((prev) => ({
        ...prev,
        currentImage: "",
        gameStatus: prev.gameStatus === "idle" ? "idle" : "playing",
      }));

      try {
        // Try to use cached image first (70% chance to use cache if available)
        // This reduces API calls and improves performance
        const useCache = Math.random() < 0.7;
        let cachedWord: string | null = null;
        let cachedImage: string | null = null;

        if (useCache) {
          cachedWord = await getRandomCachedWord(usedWordsInSession);
          if (cachedWord) {
            cachedImage = await getImageFromCache(cachedWord);
          }
        }

        // If we have cached image, use it (no API call needed)
        if (cachedImage && cachedWord) {
          const hint = generateHint(cachedWord);

          // Mark word as used
          setUsedWordsInSession((prev) => {
            const newSet = new Set(prev);
            newSet.add(cachedWord!.toLowerCase());
            return newSet;
          });

          setGameState((prev) => ({
            ...prev,
            currentImage: cachedImage!,
            currentAnswer: cachedWord!,
            currentHint: hint,
            timeLeft: GAME_DURATION,
            isPlaying: true,
            isPaused: false,
            showHint: false,
            gameStatus: "playing",
          }));

          isGeneratingRef.current = false;
          setIsLoading(false);
          return "";
        }

        // If no cache available, call API
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 65000); // 65 seconds timeout

        const response = await fetch("/api/game/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to generate image (${response.status})`
          );
        }

        const data = await response.json();

        // Validate response data
        if (!data.image || !data.answer) {
          throw new Error("Invalid response from server");
        }

        // Check if this word has already been used in this session
        const normalizedAnswer = data.answer.toLowerCase();

        // Get the latest used words by reading from the state setter
        let isWordUsed = false;
        setUsedWordsInSession((prev) => {
          isWordUsed = prev.has(normalizedAnswer);
          return prev; // Don't modify, just read
        });

        if (isWordUsed) {
          // Retry by calling the function recursively
          // But limit retries to avoid infinite loop
          if (retryCount < 3) {
            // Wait a bit before retrying to avoid rapid calls
            await new Promise((resolve) => setTimeout(resolve, 200));
            // Get fresh used words for retry
            let freshUsedWords: Set<string> = new Set();
            setUsedWordsInSession((prev) => {
              freshUsedWords = prev;
              return prev;
            });
            isGeneratingRef.current = false; // Allow retry
            return generateNewQuestion(
              setGameState,
              freshUsedWords,
              setUsedWordsInSession,
              retryCount + 1
            );
          } else {
            console.warn("Max retries reached, using word anyway");
          }
        }

        // Mark word as used
        setUsedWordsInSession((prev) => {
          const newSet = new Set(prev);
          newSet.add(normalizedAnswer);
          return newSet;
        });

        // Save to cache for future use
        await saveImageToCache(data.answer, data.image);

        setGameState((prev) => ({
          ...prev,
          currentImage: data.image,
          currentAnswer: data.answer,
          currentHint: data.hint || "",
          timeLeft: GAME_DURATION,
          isPlaying: true,
          isPaused: false,
          showHint: false,
          gameStatus: "playing",
        }));

        isGeneratingRef.current = false;
      } catch (error) {
        console.error("Error generating question:", error);
        isGeneratingRef.current = false;

        // Show user-friendly error message
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            alert(
              "Request timed out. Please check your internet connection and try again."
            );
          } else if (error.message.includes("Failed to fetch")) {
            alert(
              "Unable to connect to the server. Please make sure the server is running and try again."
            );
          } else {
            alert(`Error: ${error.message}`);
          }
        } else {
          alert("An unexpected error occurred. Please try again.");
        }
      } finally {
        if (retryCount === 0) {
          isGeneratingRef.current = false;
        }
        setIsLoading(false);
      }

      return "";
    },
    []
  );

  return { generateNewQuestion, isLoading };
};
