const envOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = [...new Set([...envOrigins, "https://www.tocca-beauty.ru", "http://localhost:5173"])];