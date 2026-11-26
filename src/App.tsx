import { useEffect } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Activity, Moon, Settings as SettingsIcon, Sun } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

function AppShell() {
  const { state, updateSettings } = useAppContext();
  const isDark = state.settings.darkMode;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#main-content"
        className="sr-only sr-only-focusable rounded bg-sky-800 px-3 py-2 text-sm font-medium text-white"
      >
        Skip to main content
      </a>

      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-sky-700 dark:text-sky-400" aria-hidden="true" />
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              AirPulse Transit
            </h1>
          </div>

          <nav aria-label="Primary navigation" className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <SettingsIcon className="h-4 w-4" aria-hidden="true" />
              Settings
            </NavLink>

            <button
              type="button"
              onClick={() => updateSettings({ darkMode: !isDark })}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDark}
              className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  );
}