import { NextRequest, NextResponse } from "next/server";
import { getImageProvidersManager } from "@/lib/imageProviders";

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

// Rate limiting - simple in-memory store
const requestCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 15; // requests per minute (increased from 10 to reduce rate limit issues)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Simple cache to reduce word generation calls
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

export async function POST(request: NextRequest) {
  // Set a maximum timeout for the entire request (45 seconds)
  // Fast providers (Unsplash/Pixabay) should respond in 2-5s
  // AI generation can take 30-40s as fallback
  const REQUEST_TIMEOUT = 45000;

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
        const client = requestCounts.get(clientId);
        const now = Date.now();
        const timeUntilReset = client
          ? RATE_LIMIT_WINDOW - (now - client.lastReset)
          : RATE_LIMIT_WINDOW;
        const retryAfter = Math.ceil(timeUntilReset / 1000); // Convert to seconds

        return NextResponse.json(
          { error: "Too many requests. Please try again in a minute." },
          {
            status: 429,
            headers: {
              "Retry-After": retryAfter.toString(),
            },
          }
        );
      }

      // Parse request body to get used words from client (localStorage)
      let clientUsedWords: Set<string> = new Set();
      try {
        const body = await request.json();
        if (body.usedWords && Array.isArray(body.usedWords)) {
          clientUsedWords = new Set(
            body.usedWords.map((word: string) => word.toLowerCase())
          );
        }
      } catch (error) {
        // If body parsing fails, continue with empty set
        console.warn("Failed to parse request body for used words:", error);
      }

      // Get or create used words set for this client (server-side tracking)
      if (!usedWordsPerClient.has(clientId)) {
        usedWordsPerClient.set(clientId, new Set<string>());
      }
      const serverUsedWords = usedWordsPerClient.get(clientId)!;

      // Combine client and server used words to avoid any duplicates
      const allUsedWords = new Set<string>();
      clientUsedWords.forEach((word) => allUsedWords.add(word));
      serverUsedWords.forEach((word) => allUsedWords.add(word));

      // Always generate a new word to avoid repetition
      // Don't use cache for words to ensure variety
      const vocabularyWord = generateRandomVocabularyWord(allUsedWords);

      // Also add to server-side tracking
      serverUsedWords.add(vocabularyWord.toLowerCase());

      // Clean up old used words sets (keep only recent clients)
      if (usedWordsPerClient.size > 1000) {
        const keysToDelete = Array.from(usedWordsPerClient.keys()).slice(
          0,
          500
        );
        keysToDelete.forEach((key) => usedWordsPerClient.delete(key));
      }

      // Get image using image providers (with caching built-in)
      const imageManager = getImageProvidersManager();
      let imageData: string;

      try {
        imageData = await imageManager.fetchImage(vocabularyWord);
      } catch (error) {
        console.error("Error fetching image:", error);
        // Return error with helpful message
        return NextResponse.json(
          {
            error: "Failed to fetch image. Please try again in a moment.",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
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
