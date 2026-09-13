/**
 * High-performance in-memory cache with Time-To-Live (TTL) and prefix invalidation.
 * Drastically reduces round-trips to remote databases for read-heavy operations like services & dashboard stats.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  /**
   * Retrieve a cached value if present and not expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Set a cached value with a TTL in seconds.
   * Default TTL is 60 seconds.
   */
  set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Check if a valid, unexpired key exists.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a specific cache key.
   */
  del(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate all keys that begin with a specific prefix.
   * Useful for clearing all service-related or dashboard-related caches on mutations.
   */
  clearPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset entire cache.
   */
  clearAll(): void {
    this.store.clear();
  }
}

export const memoryCache = new InMemoryCache();
export default memoryCache;
