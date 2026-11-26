import { Clock, Star, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function FavoritesPanel() {
  const {
    state,
    selectLocation,
    toggleFavoriteLocation,
    toggleFavoriteRoute,
    clearHistory,
  } = useAppContext();

  return (
    <aside
      aria-labelledby="favorites-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" aria-hidden="true" />
          <h2 id="favorites-heading" className="text-base font-semibold text-slate-900">
            Saved Locations
          </h2>
        </div>

        {state.favoriteLocations.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Save locations from the header bar for one-click air quality and transit checks.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-1.5">
            {state.favoriteLocations.map((loc) => (
              <li
                key={loc.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => selectLocation(loc)}
                  className="flex-1 text-left font-medium text-slate-800 hover:text-sky-700"
                >
                  {loc.name}
                  {loc.region ? `, ${loc.region}` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavoriteLocation(loc)}
                  aria-label={`Remove ${loc.name} from saved locations`}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Preferred Transit Routes</h3>
        {state.favoriteRoutes.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-500">
            Star a route in the transit panel to pin it here.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {state.favoriteRoutes.map((route) => (
              <li
                key={route.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{route.routeShortName}</span>{' '}
                  <span className="text-slate-600">at {route.stopName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavoriteRoute(route)}
                  aria-label={`Remove route ${route.routeShortName} from favorites`}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-900">Recent Searches</h3>
          </div>
          {state.searchHistory.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {state.searchHistory.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-500">No recent searches yet.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {state.searchHistory.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectLocation(item)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-800"
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
