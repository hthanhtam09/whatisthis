// Image providers service layer
// Supports multiple APIs with rate limiting, queue, and fallback

interface ImageProvider {
  name: string;
  fetchImage: (word: string) => Promise<string>;
  getRateLimit: () => { remaining: number; resetAt: number };
}

// AI Image Generation API endpoints (Pollinations - free, no API key needed)
const AI_IMAGE_APIS = [
  {
    name: "pollinations-flux",
    url: "https://image.pollinations.ai/prompt",
    model: "flux",
  },
  {
    name: "pollinations-flux-pro",
    url: "https://image.pollinations.ai/prompt",
    model: "flux-pro",
  },
  {
    name: "pollinations-schnell",
    url: "https://image.pollinations.ai/prompt",
    model: "schnell",
  },
];

interface QueuedRequest {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  word: string;
  provider: ImageProvider;
}

// Rate limit tracking per provider
interface RateLimitState {
  count: number;
  resetAt: number;
  windowMs: number;
}

// Unsplash API Provider
class UnsplashProvider implements ImageProvider {
  name = "unsplash";
  private apiKey: string;
  private rateLimit: RateLimitState = {
    count: 0,
    resetAt: Date.now() + 3600000, // 1 hour
    windowMs: 3600000, // 1 hour = 5000 requests max
  };
  private maxRequestsPerHour = 5000;
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private activeRequests = 0;
  private maxConcurrentRequests = 10;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || "";
  }

  getRateLimit() {
    const now = Date.now();
    if (now >= this.rateLimit.resetAt) {
      this.rateLimit.count = 0;
      this.rateLimit.resetAt = now + this.rateLimit.windowMs;
    }
    return {
      remaining: Math.max(0, this.maxRequestsPerHour - this.rateLimit.count),
      resetAt: this.rateLimit.resetAt,
    };
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.maxConcurrentRequests
    ) {
      const request = this.requestQueue.shift();
      if (!request) break;

      this.activeRequests++;
      this.fetchImageInternal(request.word)
        .then(request.resolve)
        .catch(request.reject)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.isProcessingQueue = false;
  }

  private async fetchImageInternal(word: string): Promise<string> {
    // Check rate limit
    const rateLimit = this.getRateLimit();
    if (rateLimit.remaining <= 0) {
      throw new Error(
        `Unsplash rate limit exceeded. Resets at ${new Date(
          rateLimit.resetAt
        ).toISOString()}`
      );
    }

    // If no API key, throw error
    if (!this.apiKey) {
      throw new Error("Unsplash API key not configured");
    }

    // Try multiple query strategies for better accuracy
    const queryStrategies = [
      word, // First try: just the word itself (most accurate)
      `${word} isolated`, // Second try: word + isolated
      `${word} object`, // Third try: word + object
    ];

    let lastError: Error | null = null;

    for (const query of queryStrategies) {
      try {
        const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&per_page=30&orientation=squarish&client_id=${this.apiKey}`;

        const response = await fetch(searchUrl, {
          headers: {
            "Accept-Version": "v1",
          },
        });

        if (!response.ok) {
          if (response.status === 429) {
            const resetHeader = response.headers.get("X-Ratelimit-Reset");
            if (resetHeader) {
              this.rateLimit.resetAt = parseInt(resetHeader) * 1000;
            }
            throw new Error("Unsplash rate limit exceeded");
          }
          // Try next query strategy
          continue;
        }

        const data = await response.json();
        if (!data.results || data.results.length === 0) {
          continue; // Try next query strategy
        }

        const wordLower = word.toLowerCase();

        // Filter and score images by relevance
        const scoredResults = data.results
          .map((result: any) => {
            const tags = (result.tags || [])
              .map((tag: any) => tag.title?.toLowerCase() || "")
              .join(" ");
            const description = (result.description || "").toLowerCase();
            const altDescription = (result.alt_description || "").toLowerCase();
            const slug = (result.slug || "").toLowerCase();

            // Calculate relevance score
            let relevance = 0;
            if (tags.includes(wordLower)) relevance += 200;
            if (description.includes(wordLower)) relevance += 100;
            if (altDescription.includes(wordLower)) relevance += 80;
            if (slug.includes(wordLower)) relevance += 60;

            // Penalize generic words that might match incorrectly
            const genericWords = [
              "paper",
              "document",
              "text",
              "background",
              "pattern",
              "abstract",
            ];
            const hasGenericWord = genericWords.some(
              (gw) =>
                tags.includes(gw) ||
                description.includes(gw) ||
                altDescription.includes(gw)
            );
            if (hasGenericWord && relevance < 100) {
              relevance = 0; // Reject if it's generic and not highly relevant
            }

            return {
              ...result,
              relevance,
              popularity: (result.likes || 0) + (result.downloads || 0) / 10,
            };
          })
          .filter((result: any) => result.relevance > 0) // Only keep relevant images
          .sort((a: any, b: any) => {
            // Prioritize relevance, then popularity
            if (b.relevance !== a.relevance) {
              return b.relevance - a.relevance;
            }
            return b.popularity - a.popularity;
          });

        if (scoredResults.length > 0) {
          const bestImage = scoredResults[0];

          // Use full size for best quality (urls.full is 1080px on longest side)
          // urls.raw is original size but may be too large, full is optimal
          const imageUrl = bestImage.urls.full || bestImage.urls.regular;

          // Fetch the image and convert to base64
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            continue; // Try next query strategy
          }

          const imageBlob = await imageResponse.blob();
          const arrayBuffer = await imageBlob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");

          // Update rate limit
          this.rateLimit.count++;

          return `data:${imageBlob.type};base64,${base64}`;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next query strategy
        continue;
      }
    }

    // All query strategies failed
    throw lastError || new Error("No accurate images found for this word");
  }

  async fetchImage(word: string): Promise<string> {
    // If we're at max concurrent requests, queue it
    if (this.activeRequests >= this.maxConcurrentRequests) {
      return new Promise<string>((resolve, reject) => {
        this.requestQueue.push({ resolve, reject, word, provider: this });
        this.processQueue();
      });
    }

    this.activeRequests++;
    try {
      return await this.fetchImageInternal(word);
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }
}

// AI Image Generation Provider (Pollinations)
class AIImageProvider implements ImageProvider {
  name = "ai-image";
  private rateLimit: RateLimitState = {
    count: 0,
    resetAt: Date.now() + 60000, // 1 minute
    windowMs: 60000, // 1 minute
  };
  private maxRequestsPerMinute = 50; // Conservative limit
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private activeRequests = 0;
  private maxConcurrentRequests = 2; // AI generation is slower, limit concurrent

  getRateLimit() {
    const now = Date.now();
    if (now >= this.rateLimit.resetAt) {
      this.rateLimit.count = 0;
      this.rateLimit.resetAt = now + this.rateLimit.windowMs;
    }
    return {
      remaining: Math.max(0, this.maxRequestsPerMinute - this.rateLimit.count),
      resetAt: this.rateLimit.resetAt,
    };
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.maxConcurrentRequests
    ) {
      const request = this.requestQueue.shift();
      if (!request) break;

      this.activeRequests++;
      this.fetchImageInternal(request.word)
        .then(request.resolve)
        .catch(request.reject)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.isProcessingQueue = false;
  }

  private getImagePromptForItem(item: string): string {
    // Enhanced prompt for maximum accuracy and clarity
    // Focus on the main object, clear and recognizable
    return `a clear, simple, and recognizable illustration of a ${item}, isolated on white background, high quality, detailed, easy to identify, educational style, bright colors, clean lines, no text, no words, centered composition, professional photography style, sharp focus, well-lit, studio lighting`;
  }

  private async fetchImageInternal(word: string): Promise<string> {
    // Check rate limit
    const rateLimit = this.getRateLimit();
    if (rateLimit.remaining <= 0) {
      const waitTime = rateLimit.resetAt - Date.now();
      throw new Error(
        `AI image generation rate limit exceeded. Wait ${Math.ceil(
          waitTime / 1000
        )}s`
      );
    }

    const prompt = this.getImagePromptForItem(word);
    const TIMEOUT_MS = 35000; // 35 seconds for AI generation (allows time for generation but fails fast if needed)

    // Try each AI API in order
    for (let attempt = 0; attempt < AI_IMAGE_APIS.length; attempt++) {
      const api = AI_IMAGE_APIS[attempt];

      try {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, TIMEOUT_MS);

        try {
          const encodedPrompt = encodeURIComponent(prompt);
          const seed = Date.now() + Math.random() * 1000;
          const apiUrl = `${api.url}/${encodedPrompt}?width=512&height=512&model=${api.model}&nologo=true&seed=${seed}`;

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Accept: "image/*",
              "Cache-Control": "no-cache",
            },
            signal: abortController.signal,
            cache: "no-store",
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            if (response.status === 429) {
              // Rate limited
              const delay = Math.min(5000 * Math.pow(2, attempt), 30000);
              await new Promise((resolve) =>
                setTimeout(resolve, delay + Math.random() * 1000)
              );
              continue;
            }

            if (response.status >= 500 && attempt < AI_IMAGE_APIS.length - 1) {
              // Server error, try next API
              continue;
            }

            throw new Error(`AI API error (${response.status})`);
          }

          const imageBlob = await response.blob();
          if (!imageBlob || imageBlob.size === 0) {
            throw new Error("Received empty image from AI API");
          }

          const arrayBuffer = await imageBlob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");

          // Update rate limit
          this.rateLimit.count++;

          return `data:${imageBlob.type};base64,${base64}`;
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError instanceof Error && fetchError.name === "AbortError") {
            // Timeout - try next API
            if (attempt < AI_IMAGE_APIS.length - 1) {
              continue;
            }
          }

          throw fetchError;
        }
      } catch (error) {
        const isLastAttempt = attempt === AI_IMAGE_APIS.length - 1;
        if (isLastAttempt) {
          throw new Error(
            `Failed to generate AI image: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
        // Try next API
        continue;
      }
    }

    throw new Error("All AI image APIs failed");
  }

  async fetchImage(word: string): Promise<string> {
    // If we're at max concurrent requests, queue it
    if (this.activeRequests >= this.maxConcurrentRequests) {
      return new Promise<string>((resolve, reject) => {
        this.requestQueue.push({ resolve, reject, word, provider: this });
        this.processQueue();
      });
    }

    this.activeRequests++;
    try {
      return await this.fetchImageInternal(word);
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }
}

// Pixabay API Provider
class PixabayProvider implements ImageProvider {
  name = "pixabay";
  private apiKey: string;
  private rateLimit: RateLimitState = {
    count: 0,
    resetAt: Date.now() + 60000, // 1 minute
    windowMs: 60000, // 1 minute = 100 requests max
  };
  private maxRequestsPerMinute = 100;
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private activeRequests = 0;
  private maxConcurrentRequests = 5;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || "";
  }

  getRateLimit() {
    const now = Date.now();
    if (now >= this.rateLimit.resetAt) {
      this.rateLimit.count = 0;
      this.rateLimit.resetAt = now + this.rateLimit.windowMs;
    }
    return {
      remaining: Math.max(0, this.maxRequestsPerMinute - this.rateLimit.count),
      resetAt: this.rateLimit.resetAt,
    };
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.maxConcurrentRequests
    ) {
      const request = this.requestQueue.shift();
      if (!request) break;

      this.activeRequests++;
      this.fetchImageInternal(request.word)
        .then(request.resolve)
        .catch(request.reject)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.isProcessingQueue = false;
  }

  private async fetchImageInternal(word: string): Promise<string> {
    // Check rate limit
    const rateLimit = this.getRateLimit();
    if (rateLimit.remaining <= 0) {
      const waitTime = rateLimit.resetAt - Date.now();
      throw new Error(
        `Pixabay rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`
      );
    }

    // If no API key, throw error
    if (!this.apiKey) {
      throw new Error("Pixabay API key not configured");
    }

    // Try multiple query strategies for better accuracy
    const queryStrategies = [
      word, // First try: just the word itself (most accurate)
      `${word} isolated`, // Second try: word + isolated
      `${word} object`, // Third try: word + object
    ];

    let lastError: Error | null = null;

    for (const query of queryStrategies) {
      try {
        const searchUrl = `https://pixabay.com/api/?key=${
          this.apiKey
        }&q=${encodeURIComponent(
          query
        )}&image_type=all&safesearch=true&order=popular&per_page=30&min_width=800&min_height=800`;

        const response = await fetch(searchUrl);

        if (!response.ok) {
          if (response.status === 429) {
            this.rateLimit.resetAt = Date.now() + 60000;
            throw new Error("Pixabay rate limit exceeded");
          }
          continue; // Try next query strategy
        }

        const data = await response.json();
        if (!data.hits || data.hits.length === 0) {
          continue; // Try next query strategy
        }

        const wordLower = word.toLowerCase();

        // Filter and score images by relevance
        const scoredHits = data.hits
          .map((hit: any) => {
            const tags = (hit.tags || "").toLowerCase();

            // Calculate relevance score
            let relevance = 0;
            if (tags.includes(wordLower)) relevance += 200;

            // Penalize generic words that might match incorrectly
            const genericWords = [
              "paper",
              "document",
              "text",
              "background",
              "pattern",
              "abstract",
            ];
            const hasGenericWord = genericWords.some((gw) => tags.includes(gw));
            if (hasGenericWord && relevance < 100) {
              relevance = 0; // Reject if it's generic and not highly relevant
            }

            return {
              ...hit,
              relevance,
              popularity:
                (hit.likes || 0) +
                (hit.views || 0) / 100 +
                (hit.downloads || 0) / 10,
            };
          })
          .filter((hit: any) => hit.relevance > 0) // Only keep relevant images
          .sort((a: any, b: any) => {
            // Prioritize relevance, then popularity
            if (b.relevance !== a.relevance) {
              return b.relevance - a.relevance;
            }
            return b.popularity - a.popularity;
          });

        if (scoredHits.length > 0) {
          const bestImage = scoredHits[0];

          // Use fullHDURL (1920x1080) or imageURL (full size) for best quality
          // Fallback to largeImageURL if fullHD not available
          const imageUrl =
            bestImage.fullHDURL ||
            bestImage.imageURL ||
            bestImage.largeImageURL ||
            bestImage.webformatURL;

          // Fetch the image and convert to base64
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            continue; // Try next query strategy
          }

          const imageBlob = await imageResponse.blob();
          const arrayBuffer = await imageBlob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");

          // Update rate limit
          this.rateLimit.count++;

          return `data:${imageBlob.type};base64,${base64}`;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next query strategy
        continue;
      }
    }

    // All query strategies failed
    throw lastError || new Error("No accurate images found for this word");
  }

  async fetchImage(word: string): Promise<string> {
    // If we're at max concurrent requests, queue it
    if (this.activeRequests >= this.maxConcurrentRequests) {
      return new Promise<string>((resolve, reject) => {
        this.requestQueue.push({ resolve, reject, word, provider: this });
        this.processQueue();
      });
    }

    this.activeRequests++;
    try {
      return await this.fetchImageInternal(word);
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }
}

// Image Providers Manager
class ImageProvidersManager {
  private providers: ImageProvider[] = [];
  private cache = new Map<string, { image: string; timestamp: number }>();
  private cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    // Initialize providers based on available API keys
    // Priority order: Unsplash > Pixabay > AI Generation
    // Unsplash/Pixabay are much faster (2-5s) than AI generation (30-60s)

    // 1. Unsplash (if API key provided) - FAST (2-5 seconds)
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashKey) {
      this.providers.push(new UnsplashProvider(unsplashKey));
    }

    // 2. Pixabay (if API key provided) - FAST (2-5 seconds)
    const pixabayKey = process.env.PIXABAY_API_KEY;
    if (pixabayKey) {
      this.providers.push(new PixabayProvider(pixabayKey));
    }

    // 3. AI Image Generation (always available, no API key needed) - SLOW (30-60 seconds)
    // Uses Pollinations API - free and unlimited, but slower
    // Only use as last resort
    this.providers.push(new AIImageProvider());

    console.log(
      `Image providers initialized: ${this.providers
        .map((p) => p.name)
        .join(", ")}`
    );
  }

  // Get cached image
  getCachedImage(word: string): string | null {
    const cached = this.cache.get(word.toLowerCase());
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.image;
    }
    return null;
  }

  // Set cached image
  setCachedImage(word: string, image: string): void {
    this.cache.set(word.toLowerCase(), { image, timestamp: Date.now() });

    // Clean old cache entries
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }

    // Keep cache size manageable (max 1000 entries)
    if (this.cache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );
      const toRemove = entries.slice(0, entries.length - 1000);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Fetch image with fallback and parallel fetching for speed
  async fetchImage(word: string): Promise<string> {
    // Check cache first
    const cached = this.getCachedImage(word);
    if (cached) {
      return cached;
    }

    if (this.providers.length === 0) {
      throw new Error("No image providers available");
    }

    // Filter providers that are available (not rate limited)
    const availableProviders = this.providers.filter((provider) => {
      const rateLimit = provider.getRateLimit();
      return rateLimit.remaining > 0;
    });

    if (availableProviders.length === 0) {
      throw new Error("All image providers are rate limited");
    }

    // Prioritize fast providers (Unsplash/Pixabay) for speed (2-5s)
    // Only use AI generation as fallback if fast providers don't find accurate images
    const fastProviders = availableProviders.filter(
      (p) => p.name === "unsplash" || p.name === "pixabay"
    );
    const aiProviders = availableProviders.filter((p) => p.name === "ai-image");

    // Try fast providers first in parallel (race condition - first one wins)
    // This is much faster (2-5s) than AI generation (30-60s)
    if (fastProviders.length > 0) {
      const fastPromises = fastProviders.map((provider) =>
        provider
          .fetchImage(word)
          .then((image) => ({ provider: provider.name, image }))
          .catch((error) => {
            console.error(`Error fetching image from ${provider.name}:`, error);
            return null;
          })
      );

      // Race: get the first successful result with timeout
      // If fast providers take more than 10s, start AI generation in parallel
      const fastTimeout = 10000; // 10 seconds
      const fastTimeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), fastTimeout);
      });

      const fastResult = await Promise.race([
        Promise.allSettled(fastPromises).then((results) => {
          for (const result of results) {
            if (
              result.status === "fulfilled" &&
              result.value !== null &&
              result.value.image
            ) {
              return result.value;
            }
          }
          return null;
        }),
        fastTimeoutPromise,
      ]);

      if (fastResult && fastResult.image) {
        // Cache the result
        this.setCachedImage(word, fastResult.image);
        return fastResult.image;
      }
    }

    // If fast providers failed or timed out, try AI generation as fallback
    // AI generation is slower but more accurate
    for (const provider of aiProviders) {
      try {
        const image = await provider.fetchImage(word);

        // Cache the result
        this.setCachedImage(word, image);

        return image;
      } catch (error) {
        console.error(`Error fetching image from ${provider.name}:`, error);
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(`All image providers failed. Please try again.`);
  }

  // Get provider status
  getStatus() {
    return this.providers.map((provider) => ({
      name: provider.name,
      rateLimit: provider.getRateLimit(),
    }));
  }
}

// Singleton instance
let imageProvidersManager: ImageProvidersManager | null = null;

export const getImageProvidersManager = (): ImageProvidersManager => {
  if (!imageProvidersManager) {
    imageProvidersManager = new ImageProvidersManager();
  }
  return imageProvidersManager;
};
