import { axiosInstance } from "@/shared/lib/axiosInstance";

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
  const { data } = await axiosInstance.post<GeoSortResponse>("/ai/geo-sort", payload);

  return data;
}
