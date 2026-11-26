# AirPulse Transit — Air Quality & Nearby Transit Tracker

A client-focused React + TypeScript web application for monitoring real-time air quality (US/EU AQI, PM2.5, PM10, CO, NO2, O3) alongside nearby public transit stops and live/scheduled ETAs.

## Setup & Run Instructions

### Prerequisites
- Node.js 18+ and npm 9+

### Development
```bash
npm install
npm run dev
```

### Type-check, Lint & Production Build
```bash
npm run lint
npm run build
npm run preview
```

## Data Sources
- **Air Quality (Primary, Keyless)**: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
- **Air Quality (Optional Ground Stations)**: [OpenAQ v3 REST API](https://docs.openaq.org/using-the-api/quick-start) (configure key in Settings)
- **Geocoding**: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) & [Nominatim](https://nominatim.openstreetmap.org/)
- **Transit (Live GTFS-RT)**: [Transitland v2 REST API](https://www.transit.land/documentation/rest-api/departures) (configure key in Settings)
- **Transit (Keyless Stop Discovery Fallback)**: [Overpass API (OpenStreetMap)](https://wiki.openstreetmap.org/wiki/Overpass_API)
- **Map**: [Leaflet](https://leafletjs.com/) + OpenStreetMap tiles
