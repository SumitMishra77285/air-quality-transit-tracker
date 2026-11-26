import type { AirQualityData, LocationPoint } from '../types';
import { readCache, writeCache } from '../utils/storage';
import { fetchJson } from './client';

const AIR_QUALITY_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface OpenMeteoAirQualityResponse {
  latitude: number;
  longitude: number;
  current?: {
    time: string;
    us_aqi?: number | null;
    european_aqi?: number | null;
    pm2_5?: number | null;
    pm10?: number | null;
    carbon_monoxide?: number | null;
    nitrogen_dioxide?: number | null;
    ozone?: number | null;
  };
  current_units?: {
    pm2_5?: string;
    pm10?: string;
    carbon_monoxide?: string;
    nitrogen_dioxide?: string;
    ozone?: string;
  };
}

interface OpenAqLatestResponse {
  results: Array<{
    sensorsId: number;
    value: number;
    datetime: { utc: string };
    coordinates: { latitude: number; longitude: number };
    parameter?: { name: string; units: string };
  }>;
}

interface OpenAqLocationsResponse {
  results: Array<{
    id: number;
    name: string;
    sensors: Array<{
      id: number;
      parameter: { name: string; units: string };
    }>;
  }>;
}

export async function fetchAirQuality(
  location: LocationPoint,
  options: { openaqApiKey?: string; forceRefresh?: boolean } = {},
): Promise<AirQualityData> {
  const cacheKey = `aq_${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`;

  if (!options.forceRefresh) {
    const cached = readCache<AirQualityData>(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }

  // Primary source: Open-Meteo Air Quality API (keyless, CORS-enabled, global coverage)
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    current: [
      'us_aqi',
      'european_aqi',
      'pm2_5',
      'pm10',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'ozone',
    ].join(','),
    timezone: 'auto',
  });

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  const raw = await fetchJson<OpenMeteoAirQualityResponse>(url);

  const result: AirQualityData = {
    locationId: location.id,
    latitude: raw.latitude,
    longitude: raw.longitude,
    usAqi: raw.current?.us_aqi ?? null,
    euAqi: raw.current?.european_aqi ?? null,
    pollutants: {
      pm25: raw.current?.pm2_5 ?? null,
      pm10: raw.current?.pm10 ?? null,
      co: raw.current?.carbon_monoxide ?? null,
      no2: raw.current?.nitrogen_dioxide ?? null,
      o3: raw.current?.ozone ?? null,
    },
    units: {
      pm25: raw.current_units?.pm2_5 ?? 'µg/m³',
      pm10: raw.current_units?.pm10 ?? 'µg/m³',
      co: raw.current_units?.carbon_monoxide ?? 'µg/m³',
      no2: raw.current_units?.nitrogen_dioxide ?? 'µg/m³',
      o3: raw.current_units?.ozone ?? 'µg/m³',
    },
    fetchedAt: raw.current?.time ?? new Date().toISOString(),
    provider: 'open-meteo',
    fromCache: false,
  };

  // Optional enrichment from OpenAQ v3 ground-station network when API key is provided
  if (options.openaqApiKey?.trim()) {
    try {
      const stationData = await fetchOpenAqNearest(
        location.latitude,
        location.longitude,
        options.openaqApiKey.trim(),
      );
      if (stationData) {
        result.pollutants = {
          pm25: stationData.pm25 ?? result.pollutants.pm25,
          pm10: stationData.pm10 ?? result.pollutants.pm10,
          co: stationData.co ?? result.pollutants.co,
          no2: stationData.no2 ?? result.pollutants.no2,
          o3: stationData.o3 ?? result.pollutants.o3,
        };
        result.provider = 'openaq';
      }
    } catch {
      // Keep Open-Meteo reading if OpenAQ station lookup fails or has no nearby sensor
    }
  }

  writeCache(cacheKey, result, AIR_QUALITY_TTL_MS);
  return result;
}

async function fetchOpenAqNearest(
  latitude: number,
  longitude: number,
  apiKey: string,
): Promise<{
  pm25?: number;
  pm10?: number;
  co?: number;
  no2?: number;
  o3?: number;
} | null> {
  const headers = { 'X-API-Key': apiKey };
  const locParams = new URLSearchParams({
    coordinates: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    radius: '15000',
    limit: '1',
  });
  const locations = await fetchJson<OpenAqLocationsResponse>(
    `https://api.openaq.org/v3/locations?${locParams.toString()}`,
    { headers },
  );

  const station = locations.results[0];
  if (!station) return null;

  const latest = await fetchJson<OpenAqLatestResponse>(
    `https://api.openaq.org/v3/locations/${String(station.id)}/latest`,
    { headers },
  );

  const sensorToParam = new Map(
    station.sensors.map((s) => [s.id, s.parameter.name.toLowerCase()]),
  );

  const output: Record<string, number> = {};
  for (const item of latest.results) {
    const paramName = sensorToParam.get(item.sensorsId);
    if (paramName) {
      output[paramName] = item.value;
    }
  }

  return {
    pm25: output['pm25'],
    pm10: output['pm10'],
    co: output['co'],
    no2: output['no2'],
    o3: output['o3'],
  };
}
