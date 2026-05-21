import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional, Set
from math import radians, sin, cos, sqrt, atan2

DEFAULT_PORT = int(os.getenv("PORT", "8001"))
MAX_RECOMMENDATIONS = int(os.getenv("MAX_RECOMMENDATIONS", "6"))

def json_response(status_code: int, payload: Dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")

def parse_int(value: Any) -> Optional[int]:
    try:
        if value is None or value == "":
            return None
        return int(value)
    except (TypeError, ValueError):
        return None

def parse_float(value: Any) -> Optional[float]:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None

def parse_int_set(values: Any) -> Set[int]:
    if not isinstance(values, list):
        return set()
    parsed_values: Set[int] = set()
    for value in values:
        parsed_int = parse_int(value)
        if parsed_int is not None:
            parsed_values.add(parsed_int)
    return parsed_values

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Расчёт расстояния между двумя точками по координатам (в км)"""
    R = 6371.0
    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

def normalize_master(master: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(master, dict):
        return None
    master_id = parse_int(master.get("id"))
    if master_id is None:
        return None
    category_ids = parse_int_set(master.get("categoryIds", []))
    rating = parse_float(master.get("rating")) or 0.0
    review_count = parse_int(master.get("reviewCount")) or 0
    master_lat = parse_float(master.get("lat"))
    master_lon = parse_float(master.get("lon"))
    return {
        "id": master_id,
        "title": str(master.get("title", "")),
        "categoryIds": category_ids,
        "rating": rating,
        "reviewCount": review_count,
        "lat": master_lat,
        "lon": master_lon,
    }

def rank_masters(payload: Dict[str, Any]) -> List[int]:
    limit = parse_int(payload.get("limit")) or MAX_RECOMMENDATIONS
    booked_master_ids = parse_int_set(payload.get("bookedMasterIds"))
    preferred_category_ids = parse_int_set(payload.get("preferredCategoryIds"))
    client_lat = parse_float(payload.get("clientLat"))
    client_lon = parse_float(payload.get("clientLon"))
    search_radius = parse_float(payload.get("searchRadius")) or 50.0
    masters = payload.get("candidateMasters")
    if not isinstance(masters, list):
        return []
    normalized_masters = []
    for master in masters:
        normalized_master = normalize_master(master)
        if normalized_master is not None:
            normalized_masters.append(normalized_master)
    if not normalized_masters:
        return []
    if not booked_master_ids:
        normalized_masters.sort(key=lambda m: (-m["rating"], -m["reviewCount"], m["id"]))
        return [master["id"] for master in normalized_masters[:limit]]
    scored_masters = []
    for master in normalized_masters:
        if master["id"] in booked_master_ids:
            continue
        distance_score = 0
        if client_lat is not None and client_lon is not None and master["lat"] is not None and master["lon"] is not None:
            distance = haversine_distance(client_lat, client_lon, master["lat"], master["lon"])
            if distance > search_radius:
                continue
            distance_score = max(0, 10 - (distance / search_radius * 10))
        category_match = len(master["categoryIds"] & preferred_category_ids)
        if category_match <= 0 and distance_score == 0:
            continue
        score = (category_match * 10 + master["rating"] * 6 + min(10, master["reviewCount"] / 5) + distance_score)
        scored_masters.append({"id": master["id"], "score": score, "rating": master["rating"], "reviewCount": master["reviewCount"]})
    scored_masters.sort(key=lambda m: (-m["score"], -m["rating"], -m["reviewCount"], m["id"]))
    return [master["id"] for master in scored_masters[:limit]]

class RecommendationHandler(BaseHTTPRequestHandler):
    server_version = "MasterRecommendationService/1.0"
    
    def _send_json(self, status_code: int, payload: Dict[str, Any]) -> None:
        body = json_response(status_code, payload)
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)
    
    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_GET(self) -> None:
        if self.path == "/health":
            self._send_json(200, {"statusCode": 200, "message": "Python master recommendation service is running", "data": {"status": "ok"}})
            return
        self._send_json(404, {"statusCode": 404, "message": "Not found", "data": None})
    
    def do_POST(self) -> None:
        if self.path == "/recommendations":
            self._handle_recommendations()
        elif self.path == "/geo-sort":
            self._handle_geo_sort()
        else:
            self._send_json(404, {"statusCode": 404, "message": "Not found", "data": None})

    def _handle_recommendations(self) -> None:
        content_length = parse_int(self.headers.get("Content-Length")) or 0
        raw_body = self.rfile.read(content_length).decode("utf-8") if content_length else "{}"
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            return self._send_json(400, {"statusCode": 400, "message": "Invalid JSON body", "data": None})
        recommendations = rank_masters(payload)
        self._send_json(200, {"statusCode": 200, "message": "Master recommendations calculated", "data": recommendations})

    def _handle_geo_sort(self) -> None:
        content_length = parse_int(self.headers.get("Content-Length")) or 0
        raw_body = self.rfile.read(content_length).decode("utf-8") if content_length else "{}"
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            return self._send_json(400, {"statusCode": 400, "message": "Invalid JSON body", "data": None})

        client_lat = parse_float(payload.get("clientLat"))
        client_lon = parse_float(payload.get("clientLon"))
        radius_km = parse_float(payload.get("radiusKm")) or 10.0
        category_id = parse_int(payload.get("categoryId"))
        masters = payload.get("masters", [])

        if client_lat is None or client_lon is None or not isinstance(masters, list):
            return self._send_json(400, {"statusCode": 400, "message": "clientLat, clientLon and masters are required", "data": None})

        geo_sorted = []
        for m in masters:
            # ФИЛЬТР ПО КАТЕГОРИИ
            if category_id is not None:
                master_categories = parse_int_set(m.get("categoryIds", []))
                if category_id not in master_categories:
                    continue
            
            m_lat = parse_float(m.get("lat"))
            m_lon = parse_float(m.get("lon"))
            if m_lat is None or m_lon is None:
                continue
            dist = haversine_distance(client_lat, client_lon, m_lat, m_lon)
            if dist <= radius_km:
                geo_sorted.append({"id": m.get("id"), "distanceKm": round(dist, 2)})

        geo_sorted.sort(key=lambda x: x["distanceKm"])
        self._send_json(200, {"statusCode": 200, "message": "Masters sorted by distance", "data": geo_sorted})
    
    def log_message(self, format: str, *args: Any) -> None:
        return

def main() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", DEFAULT_PORT), RecommendationHandler)
    print(f"Python master recommendation service listening on port {DEFAULT_PORT}")
    server.serve_forever()

if __name__ == "__main__":
    main()