"use client";

import { Map as YandexMap, Placemark, YMaps } from "@pbe/react-yandex-maps";

type MasterMapPoint = {
  id: number;
  name: string;
  coords: [number, number];
  distanceKm?: number;
};

type YandexMastersMapProps = {
  center: [number, number];
  clientLocation?: {
    lat: number;
    lon: number;
  } | null;
  isNearbyMode: boolean;
  points: MasterMapPoint[];
};

export default function YandexMastersMap({
  center,
  clientLocation,
  isNearbyMode,
  points,
}: YandexMastersMapProps) {
  const zoom = isNearbyMode ? 12 : 10;

  return (
    <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY }}>
      <YandexMap
        defaultState={{ center, zoom }}
        state={{ center, zoom }}
        width="100%"
        height="100%"
      >
        {clientLocation ? (
          <Placemark
            geometry={[clientLocation.lat, clientLocation.lon]}
            options={{ preset: "islands#blueCircleDotIcon" }}
            properties={{ balloonContent: "Вы здесь" }}
          />
        ) : null}
        {points.map((master) => (
          <Placemark
            geometry={master.coords}
            key={master.id}
            options={{ preset: "islands#redIcon" }}
            properties={{
              balloonContent: master.distanceKm
                ? `${master.name}: ${master.distanceKm.toFixed(1)} км`
                : master.name,
            }}
          />
        ))}
      </YandexMap>
    </YMaps>
  );
}
