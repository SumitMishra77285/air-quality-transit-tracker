import { useState } from 'react';
import { Bus, Star, Train } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { DepartureStatus, TransitMode } from '../types';

const STATUS_BADGES: Record<DepartureStatus, string> = {
  'on-time': 'bg-emerald-100 text-emerald-900',
  delayed: 'bg-rose-100 text-rose-900',
  early: 'bg-sky-100 text-sky-900',
  scheduled: 'bg-slate-100 text-slate-700',
};

export function TransitPanel() {
  const { state, toggleFavoriteRoute } = useAppContext();
  const { transit, transitLoading, transitError, favoriteRoutes, activeLocation } = state;
  const [modeFilter, setModeFilter] = useState<TransitMode | 'all'>('all');

  const stops = (transit?.stops ?? []).filter(
    (stop) => modeFilter === 'all' || stop.modes.includes(modeFilter),
  );

  return (
    <section
      aria-labelledby="transit-heading"
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <h2 id="transit-heading" className="text-base font-semibold text-slate-900">
            Nearby Transit Stops &amp; ETAs
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="transit-mode-filter" className="text-xs font-medium text-slate-600">
            Mode:
          </label>
          <select
            id="transit-mode-filter"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as TransitMode | 'all')}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800"
          >
            <option value="all">All modes</option>
            <option value="bus">Bus</option>
            <option value="metro">Metro</option>
            <option value="rail">Rail</option>
            <option value="tram">Tram</option>
          </select>
        </div>
      </div>

      {transitError && (
        <div role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {transitError}
        </div>
      )}

      {transitLoading && !transit ? (
        <div className="mt-4 space-y-3 animate-pulse" aria-busy="true">
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
        </div>
      ) : stops.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          No transit stops found within {state.settings.transitRadiusMeters}m. Try increasing the search radius in Settings or selecting a downtown location.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {stops.map((stop) => (
            <li key={stop.id} className="rounded-xl border border-slate-200 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {stop.modes.includes('rail') || stop.modes.includes('metro') ? (
                    <Train className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  ) : (
                    <Bus className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  )}
                  <h3 className="text-sm font-semibold text-slate-900">{stop.name}</h3>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {stop.distanceMeters} m away • {stop.modes.join(', ')}
                </span>
              </div>

              {stop.departures.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Stop discovered via OpenStreetMap. Add a Transitland API key in Settings for live GTFS-RT departure ETAs.
                </p>
              ) : (
                <ul className="mt-2.5 divide-y divide-slate-100">
                  {stop.departures.map((dep) => {
                    const favId = `${stop.id}:${dep.routeShortName}`;
                    const isFav = favoriteRoutes.some((r) => r.id === favId);

                    return (
                      <li
                        key={dep.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex min-w-[2.5rem] justify-center rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                            {dep.routeShortName}
                          </span>
                          <div>
                            <p className="font-medium text-slate-800">{dep.headsign}</p>
                            <p className="text-xs text-slate-500">{dep.routeLongName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[dep.status]}`}>
                            {dep.etaMinutes >= 0
                              ? `${String(dep.etaMinutes)} min (${dep.status})`
                              : dep.scheduledTime}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              toggleFavoriteRoute({
                                id: favId,
                                routeShortName: dep.routeShortName,
                                routeLongName: dep.routeLongName,
                                stopId: stop.id,
                                stopName: stop.name,
                                locationId: activeLocation.id,
                                mode: dep.mode,
                              })
                            }
                            aria-label={
                              isFav
                                ? `Remove route ${dep.routeShortName} from favorites`
                                : `Save route ${dep.routeShortName} to favorites`
                            }
                            aria-pressed={isFav}
                            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                          >
                            <Star
                              className={`h-4 w-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
