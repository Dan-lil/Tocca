const crypto = require("crypto");

function verifyTelegramAuth(payload, botToken, maxAgeSeconds = 86400) {
  if (!botToken || typeof botToken !== "string") {
    return { isValid: false, error: "TELEGRAM_BOT_TOKEN не настроен" };
  }

  if (!payload || typeof payload !== "object") {
    return { isValid: false, error: "Пустые данные Telegram" };
  }

  const { hash, auth_date: authDate, id } = payload;

  if (!hash || !authDate || !id) {
    return { isValid: false, error: "Некорректные данные Telegram" };
  }

  const telegramFields = new Set([
    "id",
    "first_name",
    "last_name",
    "username",
    "photo_url",
    "auth_date",
  ]);

  const entries = Object.entries(payload)
    .filter(
      ([key, value]) =>
        telegramFields.has(key) && value !== undefined && value !== null,
    )
    .map(([key, value]) => [key, String(value)])
    .sort(([a], [b]) => a.localeCompare(b));

  const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (expectedHash !== hash) {
    return { isValid: false, error: "Подпись Telegram не прошла проверку" };
  }

  const now = Math.floor(Date.now() / 1000);
  const authTimestamp = Number(authDate);

  if (!Number.isFinite(authTimestamp)) {
    return { isValid: false, error: "Некорректное время авторизации Telegram" };
  }

  if (now - authTimestamp > maxAgeSeconds) {
    return { isValid: false, error: "Данные Telegram устарели" };
  }

  return { isValid: true, error: null };
}

module.exports = verifyTelegramAuth;
