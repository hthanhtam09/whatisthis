// Image cache utility using IndexedDB for client-side storage
const DB_NAME = "WhatIsThisImageCache";
const DB_VERSION = 1;
const STORE_NAME = "images";

interface CachedImage {
  word: string;
  image: string; // base64 data URL
  timestamp: number;
}

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "word",
        });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
};

// Save image to cache
export const saveImageToCache = async (
  word: string,
  image: string
): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const cachedImage: CachedImage = {
      word: word.toLowerCase(),
      image,
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cachedImage);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error("Failed to save image to cache"));
    });

    // Clean up old entries (older than 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const index = store.index("timestamp");
    const range = IDBKeyRange.upperBound(thirtyDaysAgo);

    index.openCursor(range).onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    db.close();
  } catch (error) {
    console.error("Error saving image to cache:", error);
    // Don't throw - cache is optional
  }
};

// Get image from cache
export const getImageFromCache = async (
  word: string
): Promise<string | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const cachedImage = await new Promise<CachedImage | null>(
      (resolve, reject) => {
        const request = store.get(word.toLowerCase());
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () =>
          reject(new Error("Failed to get image from cache"));
      }
    );

    db.close();

    if (cachedImage) {
      return cachedImage.image;
    }

    return null;
  } catch (error) {
    console.error("Error getting image from cache:", error);
    return null;
  }
};

// Get all cached words
export const getAllCachedWords = async (): Promise<string[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const words = await new Promise<string[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as CachedImage[];
        resolve(results.map((item) => item.word));
      };
      request.onerror = () => reject(new Error("Failed to get cached words"));
    });

    db.close();
    return words;
  } catch (error) {
    console.error("Error getting cached words:", error);
    return [];
  }
};

// Clear all cache
export const clearImageCache = async (): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear cache"));
    });

    db.close();
  } catch (error) {
    console.error("Error clearing cache:", error);
    throw error;
  }
};

// Get random cached word (if available)
export const getRandomCachedWord = async (
  excludeWords: Set<string> = new Set()
): Promise<string | null> => {
  try {
    const words = await getAllCachedWords();
    if (words.length === 0) {
      return null;
    }

    // Filter out words that have been used in this session
    const availableWords = words.filter(
      (word) => !excludeWords.has(word.toLowerCase())
    );

    // If all cached words have been used, return null to force API call
    if (availableWords.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableWords.length);
    return availableWords[randomIndex];
  } catch (error) {
    console.error("Error getting random cached word:", error);
    return null;
  }
};
