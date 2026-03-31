import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const data: LocationData = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      // Try reverse geocoding
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo) {
          data.address = [geo.street, geo.district, geo.city]
            .filter(Boolean)
            .join(', ');
        }
      } catch {
        // ignore geocoding errors
      }
      setLocation(data);
      setLoading(false);
      return data;
    } catch (e) {
      setError('Could not get location');
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { location, loading, error, requestLocation };
}
