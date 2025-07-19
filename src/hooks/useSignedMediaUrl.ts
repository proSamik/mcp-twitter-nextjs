import { useState, useEffect, useCallback } from "react";

interface SignedUrlCache {
  url: string;
  expiresAt: number;
  loading: boolean;
}

// Global cache to avoid re-generating URLs for the same media
const urlCache = new Map<string, SignedUrlCache>();

interface UseSignedMediaUrlResult {
  url: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to get signed URLs for media files with caching
 * Automatically refreshes URLs before they expire
 */
export function useSignedMediaUrl(mediaKey: string): UseSignedMediaUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSignedUrl = useCallback(async (key: string, force = false) => {
    // Check cache first (unless forced refresh)
    if (!force) {
      const cached = urlCache.get(key);
      if (cached && cached.expiresAt > Date.now() + 300000) {
        // 5 min buffer
        setUrl(cached.url);
        setLoading(false);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/media/${encodeURIComponent(key)}`);
      const data = await response.json();

      if (data.success) {
        const expiresAt = new Date(data.expiresAt).getTime();

        // Cache the URL
        urlCache.set(key, {
          url: data.url,
          expiresAt,
          loading: false,
        });

        setUrl(data.url);

        // Set up auto-refresh 5 minutes before expiry
        const refreshTime = expiresAt - Date.now() - 300000; // 5 min buffer
        if (refreshTime > 0) {
          setTimeout(() => {
            generateSignedUrl(key, true);
          }, refreshTime);
        }
      } else {
        setError(data.error || "Failed to generate signed URL");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    generateSignedUrl(mediaKey, true);
  }, [mediaKey, generateSignedUrl]);

  useEffect(() => {
    if (mediaKey) {
      // Skip if already cached and not expired
      const cached = urlCache.get(mediaKey);
      if (cached && !cached.loading && cached.expiresAt > Date.now() + 300000) {
        setUrl(cached.url);
        setLoading(false);
        setError(null);
      } else {
        generateSignedUrl(mediaKey);
      }
    }
  }, [mediaKey, generateSignedUrl]);

  return { url, loading, error, refresh };
}

/**
 * Batch generate signed URLs for multiple media keys
 * More efficient than individual requests
 */
export async function generateSignedUrls(
  mediaKeys: string[],
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  // Process in parallel
  const promises = mediaKeys.map(async (key) => {
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(key)}`);
      const data = await response.json();

      if (data.success) {
        const expiresAt = new Date(data.expiresAt).getTime();

        // Cache the URL
        urlCache.set(key, {
          url: data.url,
          expiresAt,
          loading: false,
        });

        results[key] = data.url;
      }
    } catch (error) {
      console.error(`Failed to generate signed URL for ${key}:`, error);
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Preload signed URLs for better UX
 * Call this when you know media will be needed soon
 */
export function preloadSignedUrls(mediaKeys: string[]): void {
  const keysToLoad = mediaKeys.filter((key) => {
    const cached = urlCache.get(key);
    return !cached || cached.expiresAt <= Date.now() + 300000;
  });

  if (keysToLoad.length > 0) {
    generateSignedUrls(keysToLoad);
  }
}
