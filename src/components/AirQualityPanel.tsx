import { RefreshCw, Wind } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { classifyAqi } from '../utils/aqi';

export function AirQualityPanel() {
  const { state, refreshData } = useAppContext();
  const { airQuality, aqLoading, aqError, settings } = state;

  const activeAqi =
    settings.aqiStandard === 'eu'
      ? airQuality?.euAqi ?? null
      : airQuality?.usAqi ?? null;

  const category = classifyAqi(activeAqi, settings.aqiStandard);

  const pollutants = [
    { label: 'PM2.5', value: airQuality?.pollutants.pm25, unit: airQuality?.units.pm25 ?? 'µg/m³' },
    { label: 'PM10', value: airQuality?.pollutants.pm10, unit: airQuality?.units.pm10 ?? 'µg/m³' },
    { label: 'CO', value: airQuality?.pollutants.co, unit: airQuality?.units.co ?? 'µg/m³' },
    { label: 'NO₂', value: airQuality?.pollutants.no2, unit: airQuality?.units.no2 ?? 'µg/m³' },
    { label: 'O₃', value: airQuality?.pollutants.o3, unit: airQuality?.units.o3 ?? 'µg/m³' },
  ];

  return (
    <section
      aria-labelledby="air-quality-heading"
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <h2 id="air-quality-heading" className="text-base font-semibold text-slate-900">
            Air Quality ({settings.aqiStandard === 'eu' ? 'EU AQI' : 'US AQI'})
          </h2>
        </div>

        <button
          type="button"
          onClick={() => void refreshData(true)}
          disabled={aqLoading}
          aria-label="Refresh air quality data"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${aqLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {aqError && (
        <div role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {aqError}
        </div>
      )}

      {aqLoading && !airQuality ? (
        <div className="mt-4 space-y-3 animate-pulse" aria-busy="true">
          <div className="h-16 rounded-xl bg-slate-100" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {pollutants.map((p) => (
              <div key={p.label} className="h-16 rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className={`mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 ${category.borderClass} bg-slate-50`}>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Composite Index
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-900">
                  {activeAqi !== null ? Math.round(activeAqi) : '—'}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${category.badgeClass}`}>
                  {category.label}
                </span>
              </div>
              <p className={`mt-1.5 text-sm ${category.textClass}`}>{category.guidance}</p>
            </div>

            {airQuality && (
              <div className="text-right text-xs text-slate-500">
                <p>Source: {airQuality.provider === 'openaq' ? 'OpenAQ + Open-Meteo' : 'Open-Meteo'}</p>
                <p>{airQuality.fromCache ? 'Cached reading' : 'Live reading'}</p>
                <p>Updated: {new Date(airQuality.fetchedAt).toLocaleTimeString()}</p>
              </div>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {pollutants.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
              >
                <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">
                  {item.value !== null && item.value !== undefined
                    ? item.value.toFixed(1)
                    : '—'}
                  <span className="ml-1 text-xs font-normal text-slate-500">{item.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
