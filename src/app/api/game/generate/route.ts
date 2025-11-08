import { NextRequest, NextResponse } from "next/server";

// Vocabulary list for word generation (no API needed)
const VOCABULARY_WORDS = [
  "apple",
  "banana",
  "car",
  "dog",
  "elephant",
  "fish",
  "guitar",
  "house",
  "ice",
  "juice",
  "kite",
  "lion",
  "moon",
  "nose",
  "orange",
  "pencil",
  "queen",
  "rabbit",
  "sun",
  "tree",
  "umbrella",
  "violin",
  "water",
  "xylophone",
  "yacht",
  "zebra",
  "book",
  "chair",
  "door",
  "egg",
  "flower",
  "garden",
  "hat",
  "island",
  "jacket",
  "key",
  "lamp",
  "mouse",
  "nest",
  "ocean",
  "pizza",
  "quilt",
  "rocket",
  "star",
  "table",
  "unicorn",
  "vase",
  "window",
  "x-ray",
  "yogurt",
  "zipper",
  "ball",
  "cat",
  "duck",
  "eye",
  "fork",
  "grape",
  "horse",
];

// Image generation API endpoints (with fallbacks)
// Using public APIs that don't require authentication
const IMAGE_APIS = [
  {
    name: "pollinations",
    url: "https://image.pollinations.ai/prompt",
    method: "GET", // Simpler GET request
  },
];

// Image generation cache
const imageCache = new Map<string, { image: string; timestamp: number }>();
const IMAGE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Rate limiting - simple in-memory store
const requestCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Request queue to prevent too many simultaneous API calls
interface QueuedRequest {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  prompt: string;
}

const apiRequestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
const MAX_CONCURRENT_API_CALLS = 2; // Limit concurrent API calls
let activeApiCalls = 0;

// Simple cache to reduce AI calls
const cache = new Map<string, { word: string; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Track used words per client to avoid repetition
const usedWordsPerClient = new Map<string, Set<string>>();

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${ip}-${userAgent}`;
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const client = requestCounts.get(identifier);

  if (!client || now - client.lastReset > RATE_LIMIT_WINDOW) {
    requestCounts.set(identifier, { count: 1, lastReset: now });
    return true;
  }

  if (client.count >= RATE_LIMIT) {
    return false;
  }

  client.count++;
  return true;
}

function getCachedWord(identifier: string): string | null {
  const cached = cache.get(identifier);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.word;
  }

  return null;
}

function setCachedWord(identifier: string, word: string): void {
  cache.set(identifier, { word, timestamp: Date.now() });

  // Clean old cache entries
  for (const [key, value] of cache.entries()) {
    if (Date.now() - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }

  // Keep cache size manageable
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
}

function generateRandomVocabularyWord(usedWords: Set<string>): string {
  // Filter out used words
  const availableWords = VOCABULARY_WORDS.filter(
    (word) => !usedWords.has(word.toLowerCase())
  );

  // If all words have been used, reset the used words set
  if (availableWords.length === 0) {
    usedWords.clear();
    // Return a random word from the full list
    const randomIndex = Math.floor(Math.random() * VOCABULARY_WORDS.length);
    const word = VOCABULARY_WORDS[randomIndex];
    usedWords.add(word.toLowerCase());
    return word;
  }

  // Randomly select from available words
  const randomIndex = Math.floor(Math.random() * availableWords.length);
  const word = availableWords[randomIndex];
  usedWords.add(word.toLowerCase());
  return word;
}

function getImagePromptForItem(item: string): string {
  return `a cute cartoon illustration of a ${item}, colorful, simple, clean lines, children's book style, bright colors, digital art, animation style, educational content, white background, isolated object`;
}

// Process API request queue
async function processQueue() {
  if (isProcessingQueue || apiRequestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (
    apiRequestQueue.length > 0 &&
    activeApiCalls < MAX_CONCURRENT_API_CALLS
  ) {
    const request = apiRequestQueue.shift();
    if (!request) break;

    activeApiCalls++;
    generateImageWithRetryInternal(request.prompt, 5)
      .then(request.resolve)
      .catch(request.reject)
      .finally(() => {
        activeApiCalls--;
        // Process next item in queue
        processQueue();
      });
  }

  isProcessingQueue = false;
}

// Generate image using free public APIs with retry and fallback
async function generateImageWithRetry(
  prompt: string,
  maxRetries = 5
): Promise<string> {
  // Add to queue if we have too many concurrent calls
  if (activeApiCalls >= MAX_CONCURRENT_API_CALLS) {
    return new Promise<string>((resolve, reject) => {
      apiRequestQueue.push({ resolve, reject, prompt });
      processQueue();
    });
  }

  activeApiCalls++;
  try {
    return await generateImageWithRetryInternal(prompt, maxRetries);
  } finally {
    activeApiCalls--;
    processQueue();
  }
}

// Internal function that actually makes the API call
async function generateImageWithRetryInternal(
  prompt: string,
  maxRetries = 5
): Promise<string> {
  const TIMEOUT_MS = 30000; // 30 seconds timeout per request

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const api = IMAGE_APIS[attempt % IMAGE_APIS.length];

    try {
      let response: Response;

      // Create AbortController for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

      try {
        if (api.method === "GET") {
          // Pollinations GET API - simple and reliable
          // Format: https://image.pollinations.ai/prompt/{prompt}?width=512&height=512&model=flux&nologo=true
          const encodedPrompt = encodeURIComponent(prompt);
          const apiUrl = `${
            api.url
          }/${encodedPrompt}?width=512&height=512&model=flux&nologo=true&seed=${Date.now()}`;

          response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; ImageGenerator/1.0)",
              Accept: "image/*",
            },
            signal: abortController.signal,
          });
        } else {
          // POST API fallback
          response = await fetch(api.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: prompt,
              width: 512,
              height: 512,
            }),
            signal: abortController.signal,
          });
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const status = response.status;
        const errorText = await response.text().catch(() => "Unknown error");

        // Handle different error types with appropriate delays
        if (status === 429) {
          // Rate limited - wait longer
          const delay = Math.min(5000 * Math.pow(2, attempt), 30000); // Max 30s
          const jitter = Math.random() * 1000; // Add random jitter
          await new Promise((resolve) => setTimeout(resolve, delay + jitter));
          continue;
        }

        if (status >= 500) {
          // Server error (500, 502, 503, etc.) - use exponential backoff
          const baseDelay = 3000; // Start with 3 seconds
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt) + Math.random() * 2000,
            20000 // Max 20 seconds
          );

          console.log(
            `Server error ${status} on attempt ${
              attempt + 1
            }, retrying in ${Math.round(delay)}ms`
          );

          // If this is not the last attempt, wait and retry
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        throw new Error(`API error (${status}): ${errorText}`);
      }

      // Pollinations returns image directly
      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return `data:image/png;base64,${base64}`;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isNetworkError =
        error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.includes("fetch") ||
          error.message.includes("network"));

      console.error(
        `Error with API ${api.name} (attempt ${attempt + 1}/${maxRetries}):`,
        error instanceof Error ? error.message : error
      );

      // If this is the last attempt, throw the error
      if (isLastAttempt) {
        throw new Error(
          `Failed to generate image after ${maxRetries} attempts: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Exponential backoff with jitter
      // For network errors, use shorter delays
      // For server errors, use longer delays
      const baseDelay = isNetworkError ? 2000 : 3000;
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        isNetworkError ? 10000 : 20000
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Failed to generate image: all APIs exhausted");
}

// Generate hint (simple fallback without AI)
function generateHint(word: string): string {
  const hints: Record<string, string> = {
    apple: "A red or green fruit that grows on trees",
    banana: "A yellow curved fruit that monkeys love",
    car: "A vehicle with four wheels",
    dog: "A loyal pet that barks",
    elephant: "A large gray animal with a trunk",
    fish: "Lives in water and has fins",
    guitar: "A musical instrument with strings",
    house: "A place where people live",
    ice: "Frozen water",
    juice: "A drink made from fruits",
    kite: "Flies in the sky with a string",
    lion: "The king of the jungle",
    moon: "Shines in the night sky",
    nose: "You smell with this",
    orange: "A round orange fruit",
    pencil: "You write with this",
    queen: "A female ruler",
    rabbit: "A fluffy animal with long ears",
    sun: "Shines during the day",
    tree: "Has leaves and grows tall",
    umbrella: "Keeps you dry in the rain",
    violin: "A musical instrument you play with a bow",
    water: "You drink this every day",
    xylophone: "A musical instrument with colorful bars",
    yacht: "A fancy boat",
    zebra: "A black and white striped animal",
    book: "You read this",
    chair: "You sit on this",
    door: "You open this to enter a room",
    egg: "Chickens lay these",
    flower: "Beautiful and colorful, grows in gardens",
    garden: "A place where plants grow",
    hat: "You wear this on your head",
    island: "Land surrounded by water",
    jacket: "You wear this when it's cold",
    key: "You use this to unlock doors",
    lamp: "Gives light in a room",
    mouse: "A small animal that squeaks",
    nest: "Birds live here",
    ocean: "A very large body of water",
    pizza: "A round food with cheese and toppings",
    quilt: "A warm blanket",
    rocket: "Flies to space",
    star: "Shines in the night sky",
    table: "You eat meals on this",
    unicorn: "A magical horse with a horn",
    vase: "Holds flowers",
    window: "You look through this",
    "x-ray": "Doctors use this to see bones",
    yogurt: "A creamy food made from milk",
    zipper: "Opens and closes clothes",
    ball: "You play games with this",
    cat: "A furry pet that meows",
    duck: "A bird that quacks and swims",
    eye: "You see with these",
    fork: "You eat with this",
    grape: "Small round fruit, often purple or green",
    horse: "A large animal you can ride",
  };

  return (
    hints[word.toLowerCase()] ||
    `This is a common English word starting with "${word[0].toUpperCase()}".`
  );
}

// Check image cache
function getCachedImage(word: string): string | null {
  const cached = imageCache.get(word);
  if (cached && Date.now() - cached.timestamp < IMAGE_CACHE_TTL) {
    return cached.image;
  }
  return null;
}

// Set image cache
function setCachedImage(word: string, image: string): void {
  imageCache.set(word, { image, timestamp: Date.now() });

  // Clean old cache entries
  for (const [key, value] of imageCache.entries()) {
    if (Date.now() - value.timestamp > IMAGE_CACHE_TTL) {
      imageCache.delete(key);
    }
  }

  // Keep cache size manageable
  if (imageCache.size > 200) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey) {
      imageCache.delete(oldestKey);
    }
  }
}

export async function POST(request: NextRequest) {
  // Set a maximum timeout for the entire request (120 seconds)
  // Increased to accommodate retries with exponential backoff
  const REQUEST_TIMEOUT = 120000;

  const timeoutPromise = new Promise<NextResponse>((resolve) => {
    setTimeout(() => {
      resolve(
        NextResponse.json(
          {
            error:
              "Request timeout. The image generation service is taking too long. Please try again.",
          },
          { status: 504 }
        )
      );
    }, REQUEST_TIMEOUT);
  });

  const handlerPromise = (async () => {
    try {
      const clientId = getClientIdentifier(request);

      // Check rate limiting
      if (!checkRateLimit(clientId)) {
        return NextResponse.json(
          { error: "Too many requests. Please try again in a minute." },
          { status: 429 }
        );
      }

      // Get or create used words set for this client
      if (!usedWordsPerClient.has(clientId)) {
        usedWordsPerClient.set(clientId, new Set<string>());
      }
      const usedWords = usedWordsPerClient.get(clientId)!;

      // Always generate a new word to avoid repetition
      // Don't use cache for words to ensure variety
      const vocabularyWord = generateRandomVocabularyWord(usedWords);

      // Clean up old used words sets (keep only recent clients)
      if (usedWordsPerClient.size > 1000) {
        const keysToDelete = Array.from(usedWordsPerClient.keys()).slice(
          0,
          500
        );
        keysToDelete.forEach((key) => usedWordsPerClient.delete(key));
      }

      // Check image cache first
      let imageData = getCachedImage(vocabularyWord);

      if (!imageData) {
        // Generate image based on vocabulary word
        const imagePrompt = getImagePromptForItem(vocabularyWord);

        try {
          imageData = await generateImageWithRetry(imagePrompt);
          setCachedImage(vocabularyWord, imageData);
        } catch (error) {
          console.error("Error generating image:", error);
          // Return error with helpful message
          return NextResponse.json(
            {
              error: "Failed to generate image. Please try again in a moment.",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
          );
        }
      }

      // Generate hint
      const hint = generateHint(vocabularyWord);

      const challenge = {
        image: imageData,
        answer: vocabularyWord,
        hint: hint,
      };

      return NextResponse.json(challenge);
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        {
          error: "Failed to generate game challenge",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  })();

  // Race between the handler and timeout
  return Promise.race([handlerPromise, timeoutPromise]);
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to generate challenges." },
    { status: 405 }
  );
}
