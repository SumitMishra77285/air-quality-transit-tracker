import type {
  DepartureStatus,
  LocationPoint,
  TransitDeparture,
  TransitFeedResult,
  TransitMode,
  TransitStop,
} from '../types';
import { readCache, writeCache } from '../utils/storage';
import { fetchJson } from './client';

const TRANSIT_TTL_MS = 60 * 1000; // 60 seconds for near-real-time ETA caching

interface TransitlandStopsResponse {
  stops: Array<{
    onestop_id: string;
    stop_name: string;
    geometry: { coordinates: [number, number] };
    route_stops?: Array<{
      route: {
        route_short_name: string;
        route_long_name: string;
        route_type: number;
      };
    }>;
  }>;
}

interface TransitlandDeparturesResponse {
  stops: Array<{
    onestop_id: string;
    departures: Array<{
      arrival?: { scheduled?: string; estimated?: string; delay?: number };
      departure?: { scheduled?: string; estimated?: string; delay?: number };
      trip?: {
        trip_headsign?: string;
        route?: {
          route_short_name?: string;
          route_long_name?: string;
          route_type?: number;
        };
      };
    }>;
  }>;
}

interface OverpassResponse {
  elements: Array<{
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function mapGtfsRouteType(routeType?: number): TransitMode {
  switch (routeType) {
    case 0:
      return 'tram';
    case 1:
      return 'metro';
    case 2:
      return 'rail';
    case 4:
      return 'ferry';
    default:
      return 'bus';
  }
}

function deriveStatus(delaySeconds: number, isRealtime: boolean): DepartureStatus {
  if (!isRealtime) return 'scheduled';
  if (delaySeconds >= 120) return 'delayed';
  if (delaySeconds <= -60) return 'early';
  return 'on-time';
}

export async function fetchNearbyTransit(
  location: LocationPoint,
  options: { radiusMeters?: number; transitlandApiKey?: string; forceRefresh?: boolean } = {},
): Promise<TransitFeedResult> {
  const radius = options.radiusMeters ?? 800;
  const cacheKey = `transit_${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}_${String(radius)}`;

  if (!options.forceRefresh) {
    const cached = readCache<TransitFeedResult>(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }

  // Primary: Transitland v2 REST API when an API key is configured
  if (options.transitlandApiKey?.trim()) {
    try {
      const result = await fetchFromTransitland(
        location,
        radius,
        options.transitlandApiKey.trim(),
      );
      writeCache(cacheKey, result, TRANSIT_TTL_MS);
      return result;
    } catch {
      // Fall back to OpenStreetMap Overpass stop discovery if Transitland fails
    }
  }

  // Keyless fallback: Overpass API for real nearby OpenStreetMap transit stops
  const result = await fetchFromOverpass(location, radius);
  writeCache(cacheKey, result, TRANSIT_TTL_MS);
  return result;
}

async function fetchFromTransitland(
  location: LocationPoint,
  radiusMeters: number,
  apiKey: string,
): Promise<TransitFeedResult> {
  const headers = { apikey: apiKey };
  const stopParams = new URLSearchParams({
    lat: location.latitude.toFixed(5),
    lon: location.longitude.toFixed(5),
    radius: String(radiusMeters),
    limit: '8',
  });

  const stopsRes = await fetchJson<TransitlandStopsResponse>(
    `https://transit.land/api/v2/rest/stops?${stopParams.toString()}`,
    { headers },
  );

  const stops: TransitStop[] = await Promise.all(
    stopsRes.stops.map(async (stop) => {
      const [lon, lat] = stop.geometry.coordinates;
      let departures: TransitDeparture[] = [];

      try {
        const depRes = await fetchJson<TransitlandDeparturesResponse>(
          `https://transit.land/api/v2/rest/stops/${encodeURIComponent(stop.onestop_id)}/departures?next=3600`,
          { headers },
        );
        const rawDeps = depRes.stops[0]?.departures ?? [];
        departures = rawDeps.slice(0, 6).map((d, idx) => {
          const scheduled = d.departure?.scheduled ?? d.arrival?.scheduled ?? '';
          const estimated = d.departure?.estimated ?? d.arrival?.estimated ?? null;
          const delaySeconds = d.departure?.delay ?? d.arrival?.delay ?? 0;
          const isRealtime = Boolean(estimated);
          const etaMinutes = computeEtaMinutes(estimated ?? scheduled);

          return {
            id: `${stop.onestop_id}-dep-${String(idx)}`,
            routeShortName: d.trip?.route?.route_short_name || 'Route',
            routeLongName: d.trip?.route?.route_long_name || 'Local Service',
            headsign: d.trip?.trip_headsign || 'Outbound',
            mode: mapGtfsRouteType(d.trip?.route?.route_type),
            scheduledTime: scheduled,
            estimatedTime: estimated,
            etaMinutes,
            delaySeconds,
            status: deriveStatus(delaySeconds, isRealtime),
            isRealtime,
          };
        });
      } catch {
        departures = [];
      }

      const modes = Array.from(
        new Set(
          (stop.route_stops ?? []).map((rs) => mapGtfsRouteType(rs.route.route_type)),
        ),
      );

      return {
        id: stop.onestop_id,
        name: stop.stop_name,
        latitude: lat,
        longitude: lon,
        distanceMeters: haversineMeters(location.latitude, location.longitude, lat, lon),
        modes: modes.length > 0 ? modes : ['bus'],
        departures,
        source: 'transitland',
      };
    }),
  );

  return {
    stops: stops.sort((a, b) => a.distanceMeters - b.distanceMeters),
    fetchedAt: new Date().toISOString(),
    provider: 'transitland',
    fromCache: false,
  };
}

async function fetchFromOverpass(
  location: LocationPoint,
  radiusMeters: number,
): Promise<TransitFeedResult> {
  const query = `[out:json][timeout:10];(node["highway"="bus_stop"](around:${String(radiusMeters)},${location.latitude.toFixed(5)},${location.longitude.toFixed(5)});node["railway"~"station|halt|tram_stop"](around:${String(radiusMeters)},${location.latitude.toFixed(5)},${location.longitude.toFixed(5)});node["public_transport"="platform"](around:${String(radiusMeters)},${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}););out body 12;`;

  const res = await fetchJson<OverpassResponse>(
    'https://overpass-api.de/api/interpreter',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
      timeoutMs: 12000,
    },
  );

  const seenNames = new Set<string>();
  const stops: TransitStop[] = [];

  for (const el of res.elements) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat === undefined || lon === undefined) continue;

    const name = el.tags?.['name']?.trim() || `Stop #${String(el.id)}`;
    if (seenNames.has(name)) continue;
    seenNames.add(name);

    const isRail = el.tags?.['railway'] === 'station' || el.tags?.['railway'] === 'halt';
    const isTram = el.tags?.['railway'] === 'tram_stop';
    const mode: TransitMode = isTram ? 'tram' : isRail ? 'rail' : 'bus';

    // Overpass provides static stop geometry without live GTFS-RT departures;
    // attach route_ref tags when available so users can still track & favorite stops.
    const routeRefs = (el.tags?.['route_ref'] ?? el.tags?.['ref'] ?? '')
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    const departures: TransitDeparture[] = routeRefs.map((ref, idx) => ({
      id: `${String(el.id)}-ref-${String(idx)}`,
      routeShortName: ref,
      routeLongName: `${mode.toUpperCase()} Line ${ref}`,
      headsign: el.tags?.['network'] || 'Scheduled Stop',
      mode,
      scheduledTime: 'See local timetable',
      estimatedTime: null,
      etaMinutes: -1,
      delaySeconds: 0,
      status: 'scheduled',
      isRealtime: false,
    }));

    stops.push({
      id: `osm-${String(el.id)}`,
      name,
      latitude: lat,
      longitude: lon,
      distanceMeters: haversineMeters(location.latitude, location.longitude, lat, lon),
      modes: [mode],
      departures,
      source: 'overpass',
    });
  }

  return {
    stops: stops.sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 10),
    fetchedAt: new Date().toISOString(),
    provider: 'overpass',
    fromCache: false,
  };
}

function computeEtaMinutes(isoOrTime: string): number {
  if (!isoOrTime) return -1;
  const parsed = Date.parse(isoOrTime);
  if (Number.isNaN(parsed)) return -1;
  return Math.max(0, Math.round((parsed - Date.now()) / 60000));
}
