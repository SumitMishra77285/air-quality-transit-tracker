import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function MapView() {
  const { state } = useAppContext();
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
    map.setView([latitude, longitude], 14);
    group.clearLayers();

    // Active location marker
    L.circleMarker([latitude, longitude], {
      radius: 9,
      color: '#0369a1',
      fillColor: '#0ea5e9',
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindPopup(`<strong>${name}</strong><br/>Active monitoring point`)
      .addTo(group);

    // Nearby transit stop markers
    for (const stop of state.transit?.stops ?? []) {
      L.circleMarker([stop.latitude, stop.longitude], {
        radius: 6,
        color: '#0f172a',
        fillColor: '#f59e0b',
        fillOpacity: 0.9,
        weight: 1.5,
      })
        .bindPopup(`<strong>${stop.name}</strong><br/>${String(stop.distanceMeters)} m away`)
        .addTo(group);
    }
  }, [state.activeLocation, state.transit]);

  return (
    <section
      aria-labelledby="map-view-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <h2 id="map-view-heading" className="text-base font-semibold text-slate-900">
            Area &amp; Stop Map
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          {state.transit?.stops.length ?? 0} stops plotted
        </span>
      </div>

      <div
        ref={containerRef}
        role="region"
        aria-label={`Interactive map centered on ${state.activeLocation.name}`}
        className="h-72 w-full overflow-hidden rounded-xl border border-slate-200"
      />
    </section>
  );
}
