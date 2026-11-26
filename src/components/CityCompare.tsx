import { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { fetchAirQuality } from '../api/airQuality';
import { useAppContext } from '../context/AppContext';
import type { AirQualityData, LocationPoint } from '../types';

const PRESET_CITIES: LocationPoint[] = [
  { id: '30.7333,76.7794', name: 'Chandigarh', latitude: 30.7333, longitude: 76.7794, source: 'search' },
  { id: '28.6139,77.2090', name: 'New Delhi', latitude: 28.6139, longitude: 77.209, source: 'search' },
  { id: '51.5074,-0.1278', name: 'London', latitude: 51.5074, longitude: -0.1278, source: 'search' },
  { id: '35.6762,139.6503', name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, source: 'search' },
];

export function CityCompare() {
  const { state } = useAppContext();
  const options = Array.from(
    new Map(
      [state.activeLocation, ...state.favoriteLocations, ...PRESET_CITIES].map((c) => [c.id, c]),
    ).values(),
  );

  const [cityAId, setCityAId] = useState<string>(state.activeLocation.id);
  const [cityBId, setCityBId] = useState<string>(PRESET_CITIES[1]?.id ?? state.activeLocation.id);
  const [dataA, setDataA] = useState<AirQualityData | null>(null);
  const [dataB, setDataB] = useState<AirQualityData | null>(null);

  useEffect(() => {
    setCityAId(state.activeLocation.id);
  }, [state.activeLocation.id]);

  useEffect(() => {
    const locA = options.find((c) => c.id === cityAId);
    const locB = options.find((c) => c.id === cityBId);
    if (locA) void fetchAirQuality(locA).then(setDataA).catch(() => setDataA(null));
    if (locB) void fetchAirQuality(locB).then(setDataB).catch(() => setDataB(null));
  }, [cityAId, cityBId]);

  const rows = [
    { label: 'US AQI', a: dataA?.usAqi, b: dataB?.usAqi },
    { label: 'PM2.5 (µg/m³)', a: dataA?.pollutants.pm25, b: dataB?.pollutants.pm25 },
    { label: 'PM10 (µg/m³)', a: dataA?.pollutants.pm10, b: dataB?.pollutants.pm10 },
    { label: 'NO₂ (µg/m³)', a: dataA?.pollutants.no2, b: dataB?.pollutants.no2 },
    { label: 'O₃ (µg/m³)', a: dataA?.pollutants.o3, b: dataB?.pollutants.o3 },
  ];

  return (
    <section
      aria-labelledby="compare-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5"
    >
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5 text-sky-700 dark:text-sky-400" aria-hidden="true" />
        <h2 id="compare-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100">
          City Comparison
        </h2>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          City A
          <select
            value={cityAId}
            onChange={(e) => setCityAId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {options.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          City B
          <select
            value={cityBId}
            onChange={(e) => setCityBId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {options.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-1.5 font-medium">Metric</th>
              <th className="py-1.5 text-right font-medium">
                {options.find((c) => c.id === cityAId)?.name ?? 'City A'}
              </th>
              <th className="py-1.5 text-right font-medium">
                {options.find((c) => c.id === cityBId)?.name ?? 'City B'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="py-1.5 font-medium text-slate-700 dark:text-slate-300">{r.label}</td>
                <td className="py-1.5 text-right text-slate-900 dark:text-slate-100">
                  {r.a !== null && r.a !== undefined ? r.a.toFixed(1) : '—'}
                </td>
                <td className="py-1.5 text-right text-slate-900 dark:text-slate-100">
                  {r.b !== null && r.b !== undefined ? r.b.toFixed(1) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}