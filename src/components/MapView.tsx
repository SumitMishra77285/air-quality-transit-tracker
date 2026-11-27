import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatDistance } from '../utils/format';

export function MapView() {
  const { state, selectStop } = useAppContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [state.activeLocation.latitude, state.activeLocation.longitude],
      zoom: 14,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    const { latitude, longitude, name } = state.activeLocation;
    if (!state.selectedStopId) {
      map.setView([latitude, longitude], 14);
    }
    group.clearLayers();

    L.circleMarker([latitude, longitude], {
      radius: 9,
      color: '#0369a1',
      fillColor: '#0ea5e9',
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindPopup(`<strong>${name}</strong><br/>Active monitoring point`)
      .addTo(group);

    for (const stop of state.transit?.stops ?? []) {
      const isSelected = state.selectedStopId === stop.id;
      const marker = L.circleMarker([stop.latitude, stop.longitude], {
        radius: isSelected ? 9 : 6,
        color: isSelected ? '#0284c7' : '#0f172a',
        fillColor: isSelected ? '#38bdf8' : '#f59e0b',
        fillOpacity: 0.95,
        weight: isSelected ? 3 : 1.5,
      })
        .bindPopup(
          `<strong>${stop.name}</strong><br/>${formatDistance(stop.distanceMeters, state.settings.distanceUnit)} away`,
        )
        .on('click', () => selectStop(stop.id))
        .addTo(group);

      if (isSelected) {
        map.panTo([stop.latitude, stop.longitude], { animate: true });
        marker.openPopup();
      }
    }
  }, [state.activeLocation, state.transit, state.selectedStopId, state.settings.distanceUnit, selectStop]);

  return (
    <section
      aria-labelledby="map-view-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-sky-700 dark:text-sky-400" aria-hidden="true" />
          <h2 id="map-view-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Area &amp; Stop Map
          </h2>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {state.transit?.stops.length ?? 0} stops plotted (click pin to sync)
        </span>
      </div>

      <div
        ref={containerRef}
        role="region"
        aria-label={`Interactive map centered on ${state.activeLocation.name}`}
        className="h-72 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
      />
    </section>
  );
}