import type { DistanceUnit } from '../types';

export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (unit === 'imperial') {
    const feet = Math.round(meters * 3.28084);
    if (feet >= 1320) {
      return `${(meters / 1609.344).toFixed(2)} mi`;
    }
    return `${String(feet)} ft`;
  }
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${String(Math.round(meters))} m`;
}