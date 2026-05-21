"use client";

import { useState } from "react";
import MasterGeoPicker from "@/features/master/ui/MasterGeoPicker/MasterGeoPicker";
import DistanceBadge from "@/shared/ui/DistanceBadge/DistanceBadge";

type TestMaster = {
  id: number;
  name: string;
  categoryIds: number[];
  latitude: number;
  longitude: number;
};

type NearbyMaster = TestMaster & {
  distanceKm: number;
};

type GeoSortResponse = {
  statusCode: number;
  message?: string;
  data: Array<{
    id: number;
    distanceKm: number;
  }>;
};

const TEST_MASTERS: TestMaster[] = [
  {
    id: 101,
    name: "Мастер Анна",
    categoryIds: [5],
    latitude: 55.755,
    longitude: 37.62,
  },
  {
    id: 102,
    name: "Мастер Мария",
    categoryIds: [5],
    latitude: 55.76,
    longitude: 37.625,
  },
  {
    id: 103,
    name: "Мастер Елена",
    categoryIds: [3],
    latitude: 55.74,
    longitude: 37.61,
  },
];

export default function TestGeoPage() {
  const [masterCoords, setMasterCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [loading, setLoading] = useState(false); // ← ДОБАВИЛИ
  const [error, setError] = useState<string | null>(null); // ← ДОБАВИЛИ
  const [nearbyResults, setNearbyResults] = useState<NearbyMaster[]>([]);

  const handleMasterLocationChange = (lat: number, lon: number) => {
    setMasterCoords({ lat, lon });
    console.log("Координаты мастера:", { lat, lon });
  };

  const handleFindNearby = async () => {
    const testCoords = { latitude: 55.75393, longitude: 37.62088 };

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:3000/api/ai/geo-sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientLat: testCoords.latitude,
          clientLon: testCoords.longitude,
          radiusKm: 15,
          categoryId: 5,
          masters: TEST_MASTERS.filter((m) => m.latitude && m.longitude).map(
            (m) => ({
              id: m.id,
              categoryIds: m.categoryIds,
              lat: m.latitude,
              lon: m.longitude,
            }),
          ),
        }),
      });

      const result = (await response.json()) as GeoSortResponse;

      if (result.statusCode === 200) {
        const merged = result.data.flatMap((item) => {
          const master = TEST_MASTERS.find((m) => m.id === item.id);

          if (!master) return [];

          return { ...master, distanceKm: item.distanceKm };
        });

        setNearbyResults(merged);
      } else {
        setError(result.message || "Ошибка поиска");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось соединиться с бэкендом");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Тест: Гео-поиск + Карта</h1>

      <section className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">1. Укажи локацию мастера</h2>
        <MasterGeoPicker
          initialLat={55.751244}
          initialLon={37.618423}
          onChange={handleMasterLocationChange}
        />
        {masterCoords && (
          <p className="mt-2 text-sm text-green-600">
            Выбрано: {masterCoords.lat.toFixed(5)},{" "}
            {masterCoords.lon.toFixed(5)}
          </p>
        )}
      </section>

      <section className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">
          2. Найти мастеров категории «Ногти» рядом
        </h2>
        <button
          onClick={handleFindNearby}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Ищем..." : "📍 Найти рядом"}
        </button>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </section>

      {nearbyResults.length > 0 && (
        <section className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-3">
            3. Результаты (отсортированы по расстоянию)
          </h2>
          <ul className="space-y-2">
            {nearbyResults.map((master) => (
              <li
                key={master.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span>
                  {master.name} (категория: {master.categoryIds.join(", ")})
                </span>
                <DistanceBadge distanceKm={master.distanceKm} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
