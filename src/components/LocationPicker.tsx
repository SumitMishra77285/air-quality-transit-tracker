import { useState, type FormEvent } from 'react';
import { Crosshair, Search, Star } from 'lucide-react';
import { reverseGeocode, searchLocations } from '../api/geocoding';
import { useAppContext } from '../context/AppContext';
import type { LocationPoint } from '../types';

export function LocationPicker() {
  const { state, selectLocation, toggleFavoriteLocation } = useAppContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationPoint[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFavorite = state.favoriteLocations.some(
    (loc) => loc.id === state.activeLocation.id,
  );

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setError('Enter at least 2 characters to search for a city or neighborhood.');
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const matches = await searchLocations(trimmed);
      setResults(matches);
      if (matches.length === 0) {
        setError(`No locations matched "${trimmed}". Try another city name.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location search failed.');
    } finally {
      setSearching(false);
    }
  }

  function handleGeolocate() {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void reverseGeocode(
          position.coords.latitude,
          position.coords.longitude,
        )
          .then((point) => {
            selectLocation(point);
            setResults([]);
          })
          .finally(() => setLocating(false));
      },
      (geoErr) => {
        setLocating(false);
        setError(
          geoErr.code === geoErr.PERMISSION_DENIED
            ? 'Location permission was denied. Please search for a city manually.'
            : 'Unable to determine your current location.',
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }

  return (
    <section
      aria-labelledby="location-picker-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="location-picker-heading" className="text-base font-semibold text-slate-900">
            Active Location
          </h2>
          <p className="text-sm text-slate-600">
            {state.activeLocation.name}
            {state.activeLocation.region ? `, ${state.activeLocation.region}` : ''}
            {state.activeLocation.country ? ` • ${state.activeLocation.country}` : ''}
            <span className="ml-2 text-xs text-slate-500">
              ({state.activeLocation.latitude.toFixed(3)}, {state.activeLocation.longitude.toFixed(3)})
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleFavoriteLocation(state.activeLocation)}
          aria-pressed={isFavorite}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            isFavorite
              ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} aria-hidden="true" />
          {isFavorite ? 'Saved' : 'Save Location'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="location-search-input" className="sr-only">
          Search city or location
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="location-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or neighborhood (e.g. Chandigarh, London, Seattle)..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Crosshair className="h-4 w-4" aria-hidden="true" />
            {locating ? 'Locating...' : 'Use My Location'}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ul
          aria-label="Location search results"
          className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50"
        >
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  selectLocation(item);
                  setResults([]);
                  setQuery('');
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-sky-50"
              >
                <span className="font-medium text-slate-900">
                  {item.name}
                  {item.region ? `, ${item.region}` : ''}
                </span>
                <span className="text-xs text-slate-500">{item.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
