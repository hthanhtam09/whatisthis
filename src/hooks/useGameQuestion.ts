import { useState, useCallback, useRef } from "react";
import { GameState, GAME_DURATION } from "@/types/game";
import {
  getImageFromCache,
  saveImageToCache,
  getRandomCachedWord,
} from "@/lib/imageCache";
import { generateHint } from "@/utils/gameUtils";
import { getUsedWordsFromStorage, isWordUsed } from "@/utils/usedWordsStorage";

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

      // Clear current image and hint immediately to show loading
      setGameState((prev) => ({
        ...prev,
        currentImage: "",
        currentHint: "",
        showHint: false,
        gameStatus: prev.gameStatus === "idle" ? "idle" : "playing",
      }));

      try {
        // Always try to use cached image first to reduce API calls
        // This significantly reduces rate limit issues
        let cachedWord: string | null = null;
        let cachedImage: string | null = null;

        // Combine session used words with localStorage used words
        const allUsedWords = new Set(usedWordsInSession);
        const storedUsedWords = getUsedWordsFromStorage();
        storedUsedWords.forEach((word) => allUsedWords.add(word));

        cachedWord = await getRandomCachedWord(allUsedWords);
        if (cachedWord) {
          cachedImage = await getImageFromCache(cachedWord);
        }

        // If we have cached image, use it (no API call needed)
        if (cachedImage && cachedWord) {
          // Double-check that word hasn't been used (check localStorage)
          if (isWordUsed(cachedWord)) {
            // Word was used, skip and try API instead
            cachedImage = null;
            cachedWord = null;
          } else {
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
        }

        // If no cache available, call API
        // Reuse allUsedWords already created above (combines session + localStorage used words)

        // Create AbortController for timeout
        // Fast providers (Unsplash/Pixabay) should respond in 2-5s
        // AI generation can take 30-60s, but we try fast providers first
        // So overall timeout can be shorter: 45s (allows time for fast providers + AI fallback)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 45000); // 45 seconds timeout (fast providers 2-5s + AI fallback 30-40s)

        let response: Response;
        try {
          response = await fetch("/api/game/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usedWords: Array.from(allUsedWords),
            }),
            signal: controller.signal,
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          // If fetch fails (network error, abort, etc.), throw to be caught by outer catch
          if (fetchError instanceof Error && fetchError.name === "AbortError") {
            throw new Error(
              "Request timeout. Image generation is taking too long. Please try again."
            );
          }
          throw fetchError;
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            errorData.error || `Failed to generate image (${response.status})`
          );
          // Add status code and retry-after info to error for better handling
          (error as any).status = response.status;
          (error as any).retryAfter = response.headers.get("retry-after");
          throw error;
        }

        const data = await response.json();

        // Validate response data
        if (!data.image || !data.answer) {
          throw new Error("Invalid response from server");
        }

        // Check if this word has already been used (in session or localStorage)
        const normalizedAnswer = data.answer.toLowerCase();

        // Check both session and localStorage
        const isWordUsedInSession = usedWordsInSession.has(normalizedAnswer);
        const isWordUsedInStorage = isWordUsed(normalizedAnswer);

        if (isWordUsedInSession || isWordUsedInStorage) {
          // Retry by calling the function recursively
          // But limit retries to avoid infinite loop
          if (retryCount < 3) {
            // Wait a bit before retrying to avoid rapid calls
            await new Promise((resolve) => setTimeout(resolve, 200));
            // Get fresh used words for retry (combine session + localStorage)
            let freshUsedWords: Set<string> = new Set();
            setUsedWordsInSession((prev) => {
              freshUsedWords = new Set(prev);
              const storedUsedWords = getUsedWordsFromStorage();
              storedUsedWords.forEach((word) => freshUsedWords.add(word));
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

        // If error is due to abort/timeout, show user-friendly message
        const isAbortError =
          error instanceof Error &&
          (error.name === "AbortError" ||
            error.message.includes("aborted") ||
            error.message.includes("timeout") ||
            error.message.includes("Request timeout"));

        // Check if it's a rate limit error (429)
        const isRateLimitError =
          error instanceof Error &&
          ((error as any).status === 429 ||
            error.message.includes("Too many requests") ||
            error.message.includes("429"));

        // Calculate retry delay
        let retryDelay = 1000; // Default 1 second
        if (isRateLimitError) {
          // For rate limit errors, try to use cache first before waiting
          // Get fresh used words
          const freshUsedWords = new Set(usedWordsInSession);
          const storedUsedWords = getUsedWordsFromStorage();
          storedUsedWords.forEach((word) => freshUsedWords.add(word));

          // Try to get a cached word one more time
          const cachedWord = await getRandomCachedWord(freshUsedWords);
          if (cachedWord) {
            const cachedImage = await getImageFromCache(cachedWord);
            if (cachedImage && !isWordUsed(cachedWord)) {
              // Found a cached word! Use it instead of waiting
              const hint = generateHint(cachedWord);
              setUsedWordsInSession((prev) => {
                const newSet = new Set(prev);
                newSet.add(cachedWord.toLowerCase());
                return newSet;
              });
              setGameState((prev) => ({
                ...prev,
                currentImage: cachedImage,
                currentAnswer: cachedWord,
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
          }

          // No cache available, wait longer before retrying API
          // Check if server provided retry-after header
          const retryAfter = (error as any).retryAfter;
          if (retryAfter) {
            retryDelay = parseInt(retryAfter, 10) * 1000; // Convert seconds to milliseconds
          } else {
            // Default to 65 seconds (slightly more than 1 minute rate limit window)
            retryDelay = 65000;
          }
          console.log(
            `Rate limit reached. Waiting ${
              retryDelay / 1000
            } seconds before retry...`
          );
        }

        // Only retry if it's not an abort error and we haven't exceeded retries
        // For rate limit errors, allow more retries
        const maxRetries = isRateLimitError ? 5 : 2;
        if (!isAbortError && retryCount < maxRetries) {
          console.log(
            `Retrying question generation (attempt ${
              retryCount + 1
            }/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          // Get fresh used words for retry (combine session + localStorage)
          let freshUsedWords: Set<string> = new Set();
          setUsedWordsInSession((prev) => {
            freshUsedWords = new Set(prev);
            const storedUsedWords = getUsedWordsFromStorage();
            storedUsedWords.forEach((word) => freshUsedWords.add(word));
            return prev;
          });
          isGeneratingRef.current = false; // Allow retry
          return generateNewQuestion(
            setGameState,
            freshUsedWords,
            setUsedWordsInSession,
            retryCount + 1
          );
        }

        // If all retries failed, show error state but don't crash
        setGameState((prev) => ({
          ...prev,
          currentImage: "",
          gameStatus: "idle",
        }));
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
