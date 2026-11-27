import { BarChart3, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

function barColor(aqi: number | null): string {
  if (aqi === null) return 'bg-slate-300 dark:bg-slate-600';
  if (aqi <= 50) return 'bg-emerald-500';
  if (aqi <= 100) return 'bg-amber-400';
  if (aqi <= 150) return 'bg-orange-500';
  return 'bg-rose-600';
}

export function AirQualityTrend() {
  const { state } = useAppContext();
  const points = state.airQuality?.hourly ?? [];

  if (points.length === 0) return null;

  const maxAqi = Math.max(100, ...points.map((p) => p.usAqi ?? 0));
  const bestWindows = points
    .filter((p): p is { time: string; usAqi: number; pm25: number | null } => p.usAqi !== null)
    .sort((a, b) => a.usAqi - b.usAqi)
    .slice(0, 3);

  const cleanest = bestWindows[0];

  return (
    <section
      aria-labelledby="aq-trend-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-sky-700 dark:text-sky-400" aria-hidden="true" />
          <h2 id="aq-trend-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            24-Hour US AQI Trend &amp; Best Commute Windows
          </h2>
        </div>
        {cleanest && (
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Cleanest hour: {cleanest.time.slice(11, 16)} (AQI {Math.round(cleanest.usAqi)})
          </span>
        )}
      </div>

      <div
        role="img"
        aria-label="24-hour hourly US AQI bar chart"
        className="mt-4 flex h-32 items-end gap-1"
      >
        {points.map((point) => {
          const val = point.usAqi ?? 0;
          const heightPct = Math.max(8, Math.round((val / maxAqi) * 100));
          const hourLabel = point.time.slice(11, 16);

          return (
            <div
              key={point.time}
              title={`${hourLabel} — US AQI: ${point.usAqi ?? 'N/A'}, PM2.5: ${point.pm25 ?? 'N/A'} µg/m³`}
              className="group flex h-full flex-1 flex-col items-center justify-end"
            >
              <div
                style={{ height: `${String(heightPct)}%` }}
                className={`w-full rounded-t transition-opacity group-hover:opacity-80 ${barColor(point.usAqi)}`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>{points[0]?.time.slice(11, 16) ?? '00:00'}</span>
        <span>{points[Math.floor(points.length / 2)]?.time.slice(11, 16) ?? '12:00'}</span>
        <span>{points[points.length - 1]?.time.slice(11, 16) ?? '23:00'}</span>
      </div>

      {bestWindows.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Best Outdoor Commute Windows Today
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {bestWindows.map((win) => (
              <li
                key={win.time}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              >
                {win.time.slice(11, 16)} • AQI {Math.round(win.usAqi)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}