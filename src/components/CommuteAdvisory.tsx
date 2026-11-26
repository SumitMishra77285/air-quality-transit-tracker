import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function CommuteAdvisory() {
  const { state } = useAppContext();
  const { airQuality, transit, settings } = state;

  if (!airQuality) return null;

  const aqi =
    settings.aqiStandard === 'eu' ? airQuality.euAqi : airQuality.usAqi;
  const nearestStop = transit?.stops[0];
  const nextEta = nearestStop?.departures[0]?.etaMinutes;

  const isElevated =
    aqi !== null && (settings.aqiStandard === 'eu' ? aqi > 40 : aqi > 100);

  let headline = 'Good conditions for walking or cycling to transit';
  let detail =
    'Air quality is currently within comfortable limits for outdoor waiting.';

  if (isElevated) {
    headline = 'High pollution alert — minimize outdoor stop wait time';
    detail =
      'Consider enclosed rail or bus service, wear an N95/FFP2 mask outdoors, and time your walk close to departure.';
  } else if (aqi !== null && aqi > 50 && settings.aqiStandard === 'us') {
    headline = 'Moderate air quality — plan brief outdoor waits';
    detail =
      'Most commuters are unaffected, though sensitive groups should avoid heavy exertion near busy roads.';
  }

  return (
    <section
      aria-labelledby="commute-advisory-heading"
      className={`rounded-2xl border p-4 shadow-sm ${
        isElevated
          ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40'
          : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/40'
      }`}
    >
      <div className="flex items-start gap-3">
        {isElevated ? (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
        ) : (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
        )}
        <div>
          <h2 id="commute-advisory-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {headline}
          </h2>
          <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{detail}</p>
          {nearestStop && (
            <p className="mt-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
              Nearest stop: {nearestStop.name} ({nearestStop.distanceMeters} m)
              {nextEta !== undefined && nextEta >= 0 ? ` • Next departure in ${String(nextEta)} min` : ''}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}