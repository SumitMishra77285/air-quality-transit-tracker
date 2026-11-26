import type { LocationPoint } from '../types';
import { readCache, writeCache } from '../utils/storage';
import { fetchJson } from './client';

const GEO_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export async function searchLocations(query: string): Promise<LocationPoint[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = `geo_${trimmed.toLowerCase()}`;
  const cached = readCache<LocationPoint[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    name: trimmed,
    count: '6',
    language: 'en',
    format: 'json',
  });

  const data = await fetchJson<OpenMeteoGeocodingResponse>(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
  );

  const results: LocationPoint[] = (data.results ?? []).map((item) => ({
    id: `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`,
    name: item.name,
    region: item.admin1,
    country: item.country,
    latitude: item.latitude,
    longitude: item.longitude,
    source: 'search',
  }));

  writeCache(cacheKey, results, GEO_TTL_MS);
  return results;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<LocationPoint> {
  const fallback: LocationPoint = {
    id: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    name: `Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
    latitude,
    longitude,
    source: 'geolocation',
  };

  try {
    const params = new URLSearchParams({
      lat: latitude.toFixed(5),
      lon: longitude.toFixed(5),
      format: 'jsonv2',
    });
    const data = await fetchJson<NominatimReverseResponse>(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      { timeoutMs: 5000 },
    );
    const cityName =
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      data.display_name?.split(',')[0];

    if (!cityName) return fallback;

    return {
      ...fallback,
      name: cityName,
      region: data.address?.state,
      country: data.address?.country,
    };
  } catch {
    return fallback;
  }
}
