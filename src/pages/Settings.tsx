import { useState, type FormEvent } from 'react';
import { useAppContext } from '../context/AppContext';
import type { AqiStandard } from '../types';
import { clearAllCache } from '../utils/storage';

export function Settings() {
  const { state, updateSettings } = useAppContext();
  const [aqiStandard, setAqiStandard] = useState<AqiStandard>(state.settings.aqiStandard);
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState(state.settings.autoRefreshMinutes);
  const [transitRadiusMeters, setTransitRadiusMeters] = useState(state.settings.transitRadiusMeters);
  const [transitlandApiKey, setTransitlandApiKey] = useState(state.settings.transitlandApiKey);
  const [openaqApiKey, setOpenaqApiKey] = useState(state.settings.openaqApiKey);
  const [enableOfflineSw, setEnableOfflineSw] = useState(state.settings.enableOfflineSw);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateSettings({
      aqiStandard,
      autoRefreshMinutes,
      transitRadiusMeters,
      transitlandApiKey,
      openaqApiKey,
      enableOfflineSw,
    });
    setStatusMessage('Settings saved to LocalStorage.');
  }

  function handleClearCache() {
    clearAllCache();
    setStatusMessage('Cached API responses cleared.');
  }

  return (
    <section
      aria-labelledby="settings-heading"
      className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 id="settings-heading" className="text-lg font-semibold text-slate-900">
        Tracker Settings
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Configure AQI standards, polling intervals, and optional API keys stored locally in your browser.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="aqi-standard" className="block text-sm font-medium text-slate-800">
            AQI Standard
          </label>
          <select
            id="aqi-standard"
            value={aqiStandard}
            onChange={(e) => setAqiStandard(e.target.value as AqiStandard)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="us">US EPA AQI (0–500)</option>
            <option value="eu">European AQI (0–100+)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="refresh-interval" className="block text-sm font-medium text-slate-800">
              Auto-refresh (minutes, 0 = off)
            </label>
            <input
              id="refresh-interval"
              type="number"
              min={0}
              max={60}
              value={autoRefreshMinutes}
              onChange={(e) => setAutoRefreshMinutes(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="transit-radius" className="block text-sm font-medium text-slate-800">
              Transit Search Radius (meters)
            </label>
            <input
              id="transit-radius"
              type="number"
              min={200}
              max={3000}
              step={100}
              value={transitRadiusMeters}
              onChange={(e) => setTransitRadiusMeters(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="transitland-key" className="block text-sm font-medium text-slate-800">
            Transitland v2 API Key (optional, enables live GTFS-RT departures)
          </label>
          <input
            id="transitland-key"
            type="password"
            value={transitlandApiKey}
            onChange={(e) => setTransitlandApiKey(e.target.value)}
            placeholder="Leave blank to use keyless OpenStreetMap Overpass stop discovery"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="openaq-key" className="block text-sm font-medium text-slate-800">
            OpenAQ v3 API Key (optional, enriches with ground-station sensors)
          </label>
          <input
            id="openaq-key"
            type="password"
            value={openaqApiKey}
            onChange={(e) => setOpenaqApiKey(e.target.value)}
            placeholder="Leave blank to use keyless Open-Meteo Air Quality"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={enableOfflineSw}
            onChange={(e) => setEnableOfflineSw(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Enable offline Service Worker caching (reload to apply)
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
          >
            Save Settings
          </button>
          <button
            type="button"
            onClick={handleClearCache}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear API Cache
          </button>
        </div>

        {statusMessage && (
          <p role="status" className="text-sm font-medium text-emerald-700">
            {statusMessage}
          </p>
        )}
      </form>
    </section>
  );
}
