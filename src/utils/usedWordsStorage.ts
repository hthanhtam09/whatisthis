// Utility to manage used words in localStorage for persistence across page reloads

const STORAGE_KEY = "whatisthis_used_words";
const STORAGE_TIMESTAMP_KEY = "whatisthis_used_words_timestamp";
const RESET_AFTER_DAYS = 7; // Reset used words after 7 days

/**
 * Get used words from localStorage
 */
export const getUsedWordsFromStorage = (): Set<string> => {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

    // Check if data is too old (older than RESET_AFTER_DAYS)
    if (timestamp) {
      const storedTime = parseInt(timestamp, 10);
      const daysSince = (Date.now() - storedTime) / (1000 * 60 * 60 * 24);
      if (daysSince > RESET_AFTER_DAYS) {
        // Clear old data
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        return new Set();
      }
    }

    if (stored) {
      const words = JSON.parse(stored) as string[];
      return new Set(words);
    }
  } catch (error) {
    console.error("Error reading used words from localStorage:", error);
  }

  return new Set();
};

/**
 * Save used words to localStorage
 */
export const saveUsedWordsToStorage = (usedWords: Set<string>): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const wordsArray = Array.from(usedWords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wordsArray));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Error saving used words to localStorage:", error);
    // If storage is full, try to clear old entries
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      const wordsArray = Array.from(usedWords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wordsArray));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch (clearError) {
      console.error("Error clearing and saving used words:", clearError);
    }
  }
};

/**
 * Add a word to used words storage
 */
export const addUsedWordToStorage = (word: string): void => {
  const usedWords = getUsedWordsFromStorage();
  usedWords.add(word.toLowerCase());
  saveUsedWordsToStorage(usedWords);
};

/**
 * Clear all used words from storage
 */
export const clearUsedWordsStorage = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Error clearing used words storage:", error);
  }
};

/**
 * Check if a word has been used
 */
export const isWordUsed = (word: string): boolean => {
  const usedWords = getUsedWordsFromStorage();
  return usedWords.has(word.toLowerCase());
};

