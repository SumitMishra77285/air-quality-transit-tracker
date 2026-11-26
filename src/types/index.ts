export type AqiStandard = 'us' | 'eu';

export interface LocationPoint {
  id: string;
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  source: 'geolocation' | 'search' | 'favorite';
}

export interface PollutantReadings {
  pm25: number | null;
  pm10: number | null;
  co: number | null;
  no2: number | null;
  o3: number | null;
}

export interface AirQualityData {
  locationId: string;
  latitude: number;
  longitude: number;
  usAqi: number | null;
  euAqi: number | null;
  pollutants: PollutantReadings;
  units: {
    pm25: string;
    pm10: string;
    co: string;
    no2: string;
    o3: string;
  };
  fetchedAt: string;
  provider: 'open-meteo' | 'openaq';
  fromCache?: boolean;
}

export type TransitMode = 'bus' | 'rail' | 'metro' | 'tram' | 'ferry';

export type DepartureStatus = 'on-time' | 'delayed' | 'early' | 'scheduled';

export interface TransitDeparture {
  id: string;
  routeShortName: string;
  routeLongName: string;
  headsign: string;
  mode: TransitMode;
  scheduledTime: string;
  estimatedTime: string | null;
  etaMinutes: number;
  delaySeconds: number;
  status: DepartureStatus;
  isRealtime: boolean;
}

export interface TransitStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  modes: TransitMode[];
  departures: TransitDeparture[];
  source: 'transitland' | 'overpass';
}

export interface TransitFeedResult {
  stops: TransitStop[];
  fetchedAt: string;
  provider: 'transitland' | 'overpass';
  fromCache?: boolean;
}

export interface FavoriteRoute {
  id: string;
  routeShortName: string;
  routeLongName: string;
  stopId: string;
  stopName: string;
  locationId: string;
  mode: TransitMode;
}

export interface AppSettings {
  aqiStandard: AqiStandard;
  autoRefreshMinutes: number;
  transitRadiusMeters: number;
  transitlandApiKey: string;
  openaqApiKey: string;
  enableOfflineSw: boolean;
}

export interface ApiError {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'HTTP_ERROR' | 'PARSE_ERROR' | 'GEOLOCATION_ERROR';
  message: string;
  status?: number;
}
