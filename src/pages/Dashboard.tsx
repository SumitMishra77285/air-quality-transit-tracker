import { AirQualityPanel } from '../components/AirQualityPanel';
import { FavoritesPanel } from '../components/FavoritesPanel';
import { LocationPicker } from '../components/LocationPicker';
import { MapView } from '../components/MapView';
import { TransitPanel } from '../components/TransitPanel';

export function Dashboard() {
  return (
    <div className="space-y-5">
      <LocationPicker />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <AirQualityPanel />
          <MapView />
          <TransitPanel />
        </div>

        <div className="lg:col-span-1">
          <FavoritesPanel />
        </div>
      </div>
    </div>
  );
}
