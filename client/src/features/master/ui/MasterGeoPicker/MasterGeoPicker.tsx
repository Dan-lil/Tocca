"use client";

import { useState } from "react";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";

interface MasterGeoPickerProps {
  initialLat?: number;
  initialLon?: number;
  onChange?: (lat: number, lon: number) => void;
}

type YandexMapClickEvent = {
  get: (key: "coords") => [number, number];
};

export default function MasterGeoPicker({
  initialLat = 55.751244,
  initialLon = 37.618423,
  onChange,
}: MasterGeoPickerProps) {
  const [coords, setCoords] = useState<[number, number]>([
    initialLat,
    initialLon,
  ]);

  const handleClick = (e: YandexMapClickEvent) => {
    const [lat, lon] = e.get("coords");
    setCoords([lat, lon]);
    onChange?.(lat, lon);
  };

  return (
    <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY }}>
      <div
        style={{
          width: "100%",
          height: "350px",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Map
          defaultState={{ center: coords, zoom: 15 }}
          width="100%"
          height="100%"
          onClick={handleClick}
        >
          <Placemark
            geometry={coords}
            options={{ preset: "islands#redCircleIcon" }}
          />
        </Map>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Нажмите на карту, чтобы указать вашу локацию
      </p>
    </YMaps>
  );
}
