import type {
  ClaudeVisionCacheEntry,
  ClaudeVisionCacheStats,
  ClaudeVisionResponse
} from '../../types/claude.types';

const CACHE_KEY = 'evolucionador_ocr_cache_v1';
const CACHE_HITS_KEY = 'evolucionador_ocr_cache_hits';
const CACHE_MISSES_KEY = 'evolucionador_ocr_cache_misses';

const memoryCache = new Map<string, ClaudeVisionCacheEntry>();

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const loadCache = (): Record<string, ClaudeVisionCacheEntry> => {
  if (!isBrowser()) {
    const entries: Record<string, ClaudeVisionCacheEntry> = {};
    memoryCache.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }
  const cached = localStorage.getItem(CACHE_KEY);
  return cached ? JSON.parse(cached) : {};
};

const saveCache = (cache: Record<string, ClaudeVisionCacheEntry>): void => {
  if (!isBrowser()) {
    memoryCache.clear();
    Object.entries(cache).forEach(([key, value]) => memoryCache.set(key, value));
    return;
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

const incrementCounter = (key: string): void => {
  if (!isBrowser()) return;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, (current + 1).toString());
};

const readCounter = (key: string): number => {
  if (!isBrowser()) return 0;
  return parseInt(localStorage.getItem(key) || '0', 10);
};

export class ClaudeCacheService {
  async get(key: string): Promise<ClaudeVisionResponse | null> {
    try {
      const cache = loadCache();
      const entry = cache[key];

      if (!entry) {
        incrementCounter(CACHE_MISSES_KEY);
        return null;
      }

      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        incrementCounter(CACHE_MISSES_KEY);
        return null;
      }

      incrementCounter(CACHE_HITS_KEY);
      return entry.data;
    } catch (error) {
      console.error('[ClaudeCacheService] Error loading cache:', error);
      return null;
    }
  }

  async set(key: string, data: ClaudeVisionResponse, ttlSeconds: number): Promise<void> {
    try {
      const cache = loadCache();

      cache[key] = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlSeconds * 1000,
        cost: data.cost
      };

      saveCache(cache);
    } catch (error) {
      console.error('[ClaudeCacheService] Error saving cache:', error);
    }
  }

  async delete(key: string): Promise<void> {
    const cache = loadCache();
    delete cache[key];
    saveCache(cache);
  }

  async clear(): Promise<void> {
    if (!isBrowser()) {
      memoryCache.clear();
      return;
    }
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_HITS_KEY);
    localStorage.removeItem(CACHE_MISSES_KEY);
  }

  async getStats(): Promise<ClaudeVisionCacheStats> {
    const cache = loadCache();
    const entries = Object.values(cache);

    const totalCostSaved = entries.reduce((sum, entry) => sum + entry.cost, 0);
    const oldestEntry = entries.length > 0 ? Math.min(...entries.map((entry) => entry.timestamp)) : Date.now();

    return {
      totalEntries: entries.length,
      totalCostSaved,
      hitRate: this.getHitRate(),
      oldestEntry
    };
  }

  private getHitRate(): number {
    const hits = readCounter(CACHE_HITS_KEY);
    const misses = readCounter(CACHE_MISSES_KEY);
    return hits + misses > 0 ? hits / (hits + misses) : 0;
  }
}
