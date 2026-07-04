import { IUserCache } from "../../domain/ports/IUserCache";

interface CacheEntry {
  exists: boolean;
  expiresAt: number;
}

export class InMemoryUserCache implements IUserCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(ttlSeconds: number = 300) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get(userId: string): boolean | null {
    const entry = this.cache.get(userId);
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return null;
    }
    return entry.exists;
  }

  set(userId: string, exists: boolean): void {
    this.cache.set(userId, {
      exists,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }
}
