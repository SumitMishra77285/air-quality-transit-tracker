import type { AppSettings, FavoriteRoute, LocationPoint } from '../types';

const STORAGE_KEYS = {
  CACHE_PREFIX: 'airpulse_cache_',
  FAVORITE_LOCATIONS: 'airpulse_fav_locations',
  FAVORITE_ROUTES: 'airpulse_fav_routes',
  SEARCH_HISTORY: 'airpulse_search_history',
  SETTINGS: 'airpulse_settings',
} as const;

interface CacheEnvelope<T> {
  data: T;
  expiresAt: number;
  cachedAt: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  aqiStandard: 'us',
  autoRefreshMinutes: 5,
  transitRadiusMeters: 800,
  transitlandApiKey: '',
  openaqApiKey: '',
  enableOfflineSw: false,
  darkMode: false,
};

export function readCache<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(`${STORAGE_KEYS.CACHE_PREFIX}${key}`);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T, ttlMs: number): void {
  const envelope: CacheEnvelope<T> = {
    data,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };
  try {
    window.localStorage.setItem(
      `${STORAGE_KEYS.CACHE_PREFIX}${key}`,
      JSON.stringify(envelope),
    );
  } catch {
    evictCacheEntries();
    try {
      window.localStorage.setItem(
        `${STORAGE_KEYS.CACHE_PREFIX}${key}`,
        JSON.stringify(envelope),
      );
    } catch {
      // Ignore if still full
    }
  }
}

export function clearAllCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(STORAGE_KEYS.CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

function evictCacheEntries(): void {
  try {
    const now = Date.now();
    for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
      const k = window.localStorage.key(i);
      if (!k?.startsWith(STORAGE_KEYS.CACHE_PREFIX)) continue;
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      try {
        const env = JSON.parse(raw) as CacheEnvelope<unknown>;
        if (now > env.expiresAt) {
          window.localStorage.removeItem(k);
        }
      } catch {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // Ignore
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore
  }
}

export const storage = {
  getFavoriteLocations: (): LocationPoint[] =>
    readJson<LocationPoint[]>(STORAGE_KEYS.FAVORITE_LOCATIONS, []),
  saveFavoriteLocations: (items: LocationPoint[]): void =>
    writeJson(STORAGE_KEYS.FAVORITE_LOCATIONS, items),

  getFavoriteRoutes: (): FavoriteRoute[] =>
    readJson<FavoriteRoute[]>(STORAGE_KEYS.FAVORITE_ROUTES, []),
  saveFavoriteRoutes: (items: FavoriteRoute[]): void =>
    writeJson(STORAGE_KEYS.FAVORITE_ROUTES, items),

  getSearchHistory: (): LocationPoint[] =>
    readJson<LocationPoint[]>(STORAGE_KEYS.SEARCH_HISTORY, []),
  saveSearchHistory: (items: LocationPoint[]): void =>
    writeJson(STORAGE_KEYS.SEARCH_HISTORY, items),

  getSettings: (): AppSettings => ({
    ...DEFAULT_SETTINGS,
    ...readJson<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS, {}),
  }),
  saveSettings: (settings: AppSettings): void =>
    writeJson(STORAGE_KEYS.SETTINGS, settings),
};