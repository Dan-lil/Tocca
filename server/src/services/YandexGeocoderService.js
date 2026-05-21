const https = require("https");

class YandexGeocoderService {
  static async geocodeAddress(address) {
    const apiKey = process.env.YANDEX_GEOCODER_API_KEY;
    const baseUrl =
      process.env.YANDEX_GEOCODER_URL || "https://geocode-maps.yandex.ru/1.x/";
    if (!apiKey) {
      console.warn("YANDEX_GEOCODER_API_KEY not set, skipping geocoding");
      return null;
    }
    const url = `${baseUrl}?apikey=${apiKey}&geocode=${encodeURIComponent(address)}&format=json&results=1`;
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              const feature =
                parsed?.response?.GeoObjectCollection?.featureMember?.[0]
                  ?.GeoObject;
              const pos = feature?.Point?.pos;
              if (!pos) {
                resolve(null);
                return;
              }
              const [lon, lat] = pos.split(" ").map(Number);
              resolve({ lat, lon, address: feature?.name || address });
            } catch (e) {
              reject(new Error(`Geocoder parse error: ${e.message}`));
            }
          });
        })
        .on("error", reject);
    });
  }
}
module.exports = YandexGeocoderService;
