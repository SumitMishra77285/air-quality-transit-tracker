import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Activity, Settings as SettingsIcon } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <a
            href="#main-content"
            className="sr-only sr-only-focusable rounded bg-sky-800 px-3 py-2 text-sm font-medium text-white"
          >
            Skip to main content
          </a>

          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-sky-700" aria-hidden="true" />
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
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
                        ? 'bg-sky-50 text-sky-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                        ? 'bg-sky-50 text-sky-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <SettingsIcon className="h-4 w-4" aria-hidden="true" />
                  Settings
                </NavLink>
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
      </BrowserRouter>
    </AppProvider>
  );
}
