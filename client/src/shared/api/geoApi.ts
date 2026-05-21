export interface GeoSortRequest {
  clientLat: number;
  clientLon: number;
  radiusKm?: number;
  categoryId?: number;
  masters: Array<{
    id: number;
    categoryIds: number[];
    lat: number;
    lon: number;
  }>;
}

export interface GeoSortResponse {
  statusCode: number;
  message: string;
  data: Array<{ id: number; distanceKm: number }>;
  error: string | null;
}

export async function fetchNearbyMasters(
  payload: GeoSortRequest,
): Promise<GeoSortResponse> {
  const res = await fetch("/api/ai/geo-sort", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
