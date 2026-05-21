import { useState, useCallback } from "react";
import { fetchNearbyMasters, GeoSortRequest } from "@/shared/api/geoApi";

export function useNearbySearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientLocation, setClientLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const search = useCallback(
    async (request: Omit<GeoSortRequest, "clientLat" | "clientLon">) => {
      setLoading(true);
      setError(null);
      try {
        if (!navigator.geolocation)
          throw new Error("Геолокация не поддерживается");

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          },
        );

        const payload: GeoSortRequest = {
          ...request,
          clientLat: position.coords.latitude,
          clientLon: position.coords.longitude,
        };

        setClientLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });

        const result = await fetchNearbyMasters(payload);
        if (result.statusCode !== 200)
          throw new Error(result.message || "Ошибка поиска");
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось определить местоположение");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { search, loading, error, clientLocation };
}
