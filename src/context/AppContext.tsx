import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import { fetchAirQuality } from '../api/airQuality';
import { fetchNearbyTransit } from '../api/transit';
import type {
  AirQualityData,
  AppSettings,
  FavoriteRoute,
  LocationPoint,
  TransitFeedResult,
} from '../types';
import { storage } from '../utils/storage';

interface AppState {
  activeLocation: LocationPoint;
  selectedStopId: string | null;
  airQuality: AirQualityData | null;
  transit: TransitFeedResult | null;
  aqLoading: boolean;
  transitLoading: boolean;
  aqError: string | null;
  transitError: string | null;
  favoriteLocations: LocationPoint[];
  favoriteRoutes: FavoriteRoute[];
  searchHistory: LocationPoint[];
  settings: AppSettings;
}

type AppAction =
  | { type: 'SET_LOCATION'; payload: LocationPoint }
  | { type: 'SELECT_STOP'; payload: string | null }
  | { type: 'AQ_REQUEST' }
  | { type: 'AQ_SUCCESS'; payload: AirQualityData }
  | { type: 'AQ_ERROR'; payload: string }
  | { type: 'TRANSIT_REQUEST' }
  | { type: 'TRANSIT_SUCCESS'; payload: TransitFeedResult }
  | { type: 'TRANSIT_ERROR'; payload: string }
  | { type: 'TOGGLE_FAVORITE_LOCATION'; payload: LocationPoint }
  | { type: 'TOGGLE_FAVORITE_ROUTE'; payload: FavoriteRoute }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'CLEAR_HISTORY' };

const DEFAULT_LOCATION: LocationPoint = {
  id: '30.7333,76.7794',
  name: 'Chandigarh',
  region: 'Punjab',
  country: 'India',
  latitude: 30.7333,
  longitude: 76.7794,
  source: 'search',
};

function createInitialState(): AppState {
  const history = storage.getSearchHistory();
  const favs = storage.getFavoriteLocations();
  const initialLocation = history[0] ?? favs[0] ?? DEFAULT_LOCATION;

  return {
    activeLocation: initialLocation,
    selectedStopId: null,
    airQuality: null,
    transit: null,
    aqLoading: false,
    transitLoading: false,
    aqError: null,
    transitError: null,
    favoriteLocations: favs,
    favoriteRoutes: storage.getFavoriteRoutes(),
    searchHistory: history,
    settings: storage.getSettings(),
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOCATION': {
      const nextHistory = [
        action.payload,
        ...state.searchHistory.filter((item) => item.id !== action.payload.id),
      ].slice(0, 8);
      storage.saveSearchHistory(nextHistory);
      return {
        ...state,
        activeLocation: action.payload,
        selectedStopId: null,
        searchHistory: nextHistory,
      };
    }
    case 'SELECT_STOP':
      return { ...state, selectedStopId: action.payload };
    case 'AQ_REQUEST':
      return { ...state, aqLoading: true, aqError: null };
    case 'AQ_SUCCESS':
      return { ...state, aqLoading: false, airQuality: action.payload };
    case 'AQ_ERROR':
      return { ...state, aqLoading: false, aqError: action.payload };
    case 'TRANSIT_REQUEST':
      return { ...state, transitLoading: true, transitError: null };
    case 'TRANSIT_SUCCESS':
      return { ...state, transitLoading: false, transit: action.payload };
    case 'TRANSIT_ERROR':
      return { ...state, transitLoading: false, transitError: action.payload };
    case 'TOGGLE_FAVORITE_LOCATION': {
      const exists = state.favoriteLocations.some((f) => f.id === action.payload.id);
      const next = exists
        ? state.favoriteLocations.filter((f) => f.id !== action.payload.id)
        : [{ ...action.payload, source: 'favorite' as const }, ...state.favoriteLocations];
      storage.saveFavoriteLocations(next);
      return { ...state, favoriteLocations: next };
    }
    case 'TOGGLE_FAVORITE_ROUTE': {
      const exists = state.favoriteRoutes.some((r) => r.id === action.payload.id);
      const next = exists
        ? state.favoriteRoutes.filter((r) => r.id !== action.payload.id)
        : [action.payload, ...state.favoriteRoutes];
      storage.saveFavoriteRoutes(next);
      return { ...state, favoriteRoutes: next };
    }
    case 'UPDATE_SETTINGS': {
      const next = { ...state.settings, ...action.payload };
      storage.saveSettings(next);
      return { ...state, settings: next };
    }
    case 'CLEAR_HISTORY':
      storage.saveSearchHistory([]);
      return { ...state, searchHistory: [] };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  selectLocation: (location: LocationPoint) => void;
  selectStop: (stopId: string | null) => void;
  refreshData: (forceRefresh?: boolean) => Promise<void>;
  toggleFavoriteLocation: (location: LocationPoint) => void;
  toggleFavoriteRoute: (route: FavoriteRoute) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  clearHistory: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  const loadDataForLocation = useCallback(
    async (location: LocationPoint, forceRefresh = false) => {
      dispatch({ type: 'AQ_REQUEST' });
      dispatch({ type: 'TRANSIT_REQUEST' });

      const aqPromise = fetchAirQuality(location, {
        openaqApiKey: state.settings.openaqApiKey,
        forceRefresh,
      })
        .then((data) => {
          dispatch({ type: 'AQ_SUCCESS', payload: data });
          const currentAqi =
            state.settings.aqiStandard === 'eu' ? data.euAqi : data.usAqi;
          if (
            currentAqi !== null &&
            state.settings.aqiAlertThreshold > 0 &&
            currentAqi >= state.settings.aqiAlertThreshold &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(`Air Quality Alert: ${location.name}`, {
              body: `Current AQI is ${String(Math.round(currentAqi))}, above your ${String(state.settings.aqiAlertThreshold)} threshold.`,
            });
          }
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Unable to load air quality data.';
          dispatch({ type: 'AQ_ERROR', payload: message });
        });

      const transitPromise = fetchNearbyTransit(location, {
        radiusMeters: state.settings.transitRadiusMeters,
        transitlandApiKey: state.settings.transitlandApiKey,
        forceRefresh,
      })
        .then((data) => dispatch({ type: 'TRANSIT_SUCCESS', payload: data }))
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Unable to load nearby transit stops.';
          dispatch({ type: 'TRANSIT_ERROR', payload: message });
        });

      await Promise.all([aqPromise, transitPromise]);
    },
    [
      state.settings.aqiAlertThreshold,
      state.settings.aqiStandard,
      state.settings.openaqApiKey,
      state.settings.transitRadiusMeters,
      state.settings.transitlandApiKey,
    ],
  );

  useEffect(() => {
    void loadDataForLocation(state.activeLocation, false);
  }, [state.activeLocation, loadDataForLocation]);

  useEffect(() => {
    if (state.settings.autoRefreshMinutes <= 0) return;
    const intervalMs = state.settings.autoRefreshMinutes * 60 * 1000;
    const timer = window.setInterval(() => {
      void loadDataForLocation(state.activeLocation, true);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [state.activeLocation, state.settings.autoRefreshMinutes, loadDataForLocation]);

  const selectLocation = useCallback((location: LocationPoint) => {
    dispatch({ type: 'SET_LOCATION', payload: location });
  }, []);

  const selectStop = useCallback((stopId: string | null) => {
    dispatch({ type: 'SELECT_STOP', payload: stopId });
  }, []);

  const refreshData = useCallback(
    async (forceRefresh = true) => {
      await loadDataForLocation(state.activeLocation, forceRefresh);
    },
    [state.activeLocation, loadDataForLocation],
  );

  const toggleFavoriteLocation = useCallback((location: LocationPoint) => {
    dispatch({ type: 'TOGGLE_FAVORITE_LOCATION', payload: location });
  }, []);

  const toggleFavoriteRoute = useCallback((route: FavoriteRoute) => {
    dispatch({ type: 'TOGGLE_FAVORITE_ROUTE', payload: route });
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: partial });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        selectLocation,
        selectStop,
        refreshData,
        toggleFavoriteLocation,
        toggleFavoriteRoute,
        updateSettings,
        clearHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside an AppProvider');
  }
  return ctx;
}