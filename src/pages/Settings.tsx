import { useState, type FormEvent } from 'react';
import { Bell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { AqiStandard, DistanceUnit } from '../types';
import { clearAllCache } from '../utils/storage';

export function Settings() {
  const { state, updateSettings } = useAppContext();
  const [aqiStandard, setAqiStandard] = useState<AqiStandard>(state.settings.aqiStandard);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(state.settings.distanceUnit);
  const [aqiAlertThreshold, setAqiAlertThreshold] = useState(state.settings.aqiAlertThreshold);
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState(state.settings.autoRefreshMinutes);
  const [transitRadiusMeters, setTransitRadiusMeters] = useState(state.settings.transitRadiusMeters);
  const [transitlandApiKey, setTransitlandApiKey] = useState(state.settings.transitlandApiKey);
  const [openaqApiKey, setOpenaqApiKey] = useState(state.settings.openaqApiKey);
  const [enableOfflineSw, setEnableOfflineSw] = useState(state.settings.enableOfflineSw);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported',
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateSettings({
      aqiStandard,
      distanceUnit,
      aqiAlertThreshold,
      autoRefreshMinutes,
      transitRadiusMeters,
      transitlandApiKey,
      openaqApiKey,
      enableOfflineSw,
    });
    setStatusMessage('Settings saved to LocalStorage.');
  }

  async function handleEnableAlerts() {
    if (!('Notification' in window)) {
      setStatusMessage('Browser notifications are not supported on this device.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
    if (perm === 'granted') {
      new Notification('AirPulse Transit Alerts Enabled', {
        body: `You will be notified when AQI reaches ${String(aqiAlertThreshold)} or higher.`,
      });
    }
  }

  function handleClearCache() {
    clearAllCache();
    setStatusMessage('Cached API responses cleared.');
  }

  return (
    <section
      aria-labelledby="settings-heading"
      className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"
    >
      <h2 id="settings-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Tracker Settings
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Configure AQI standards, distance units, spike alerts, and optional API keys stored locally in your browser.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="aqi-standard" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              AQI Standard
            </label>
            <select
              id="aqi-standard"
              value={aqiStandard}
              onChange={(e) => setAqiStandard(e.target.value as AqiStandard)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="us">US EPA AQI (0–500)</option>
              <option value="eu">European AQI (0–100+)</option>
            </select>
          </div>

          <div>
            <label htmlFor="distance-unit" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Distance Unit
            </label>
            <select
              id="distance-unit"
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value as DistanceUnit)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="metric">Metric (m / km)</option>
              <option value="imperial">Imperial (ft / mi)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="aqi-threshold" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              AQI Alert Threshold
            </label>
            <input
              id="aqi-threshold"
              type="number"
              min={0}
              max={500}
              value={aqiAlertThreshold}
              onChange={(e) => setAqiAlertThreshold(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="refresh-interval" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Auto-refresh (min)
            </label>
            <input
              id="refresh-interval"
              type="number"
              min={0}
              max={60}
              value={autoRefreshMinutes}
              onChange={(e) => setAutoRefreshMinutes(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="transit-radius" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Radius (meters)
            </label>
            <input
              id="transit-radius"
              type="number"
              min={200}
              max={3000}
              step={100}
              value={transitRadiusMeters}
              onChange={(e) => setTransitRadiusMeters(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-slate-100">Browser Spike Alerts</p>
            <p>Permission status: {notifStatus}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleEnableAlerts()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-600 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50 dark:border-sky-400 dark:text-sky-300 dark:hover:bg-sky-950"
          >
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            Enable Browser Alerts
          </button>
        </div>

        <div>
          <label htmlFor="transitland-key" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
            Transitland v2 API Key (optional, enables live GTFS-RT departures)
          </label>
          <input
            id="transitland-key"
            type="password"
            value={transitlandApiKey}
            onChange={(e) => setTransitlandApiKey(e.target.value)}
            placeholder="Leave blank to use keyless OpenStreetMap Overpass stop discovery"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label htmlFor="openaq-key" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
            OpenAQ v3 API Key (optional, enriches with ground-station sensors)
          </label>
          <input
            id="openaq-key"
            type="password"
            value={openaqApiKey}
            onChange={(e) => setOpenaqApiKey(e.target.value)}
            placeholder="Leave blank to use keyless Open-Meteo Air Quality"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
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
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            Clear API Cache
          </button>
        </div>

        {statusMessage && (
          <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {statusMessage}
          </p>
        )}
      </form>
    </section>
  );
}