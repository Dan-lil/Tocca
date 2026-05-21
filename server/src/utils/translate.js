const DEFAULT_TRANSLATE_TIMEOUT_MS = 4000;

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function shouldSkipTranslation() {
  return process.env.TRANSLATE_AUTO === "off";
}

async function translateWithMyMemory(text) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", "ru|en");

  const response = await fetch(url, {
    signal: AbortSignal.timeout(DEFAULT_TRANSLATE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`MyMemory translate failed: ${response.status}`);
  }

  const data = await response.json();
  const translatedText = data?.responseData?.translatedText;

  return hasText(translatedText) ? translatedText.trim() : "";
}

async function translateWithLibreTranslate(text) {
  const endpoint = process.env.LIBRETRANSLATE_URL;

  if (!endpoint) {
    throw new Error("LIBRETRANSLATE_URL is not configured");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "ru",
      target: "en",
      format: "text",
      api_key: process.env.LIBRETRANSLATE_API_KEY || undefined,
    }),
    signal: AbortSignal.timeout(DEFAULT_TRANSLATE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate failed: ${response.status}`);
  }

  const data = await response.json();

  return hasText(data?.translatedText) ? data.translatedText.trim() : "";
}

async function translateRuToEn(text) {
  if (!hasText(text) || shouldSkipTranslation()) return "";

  const provider = process.env.TRANSLATE_PROVIDER || "mymemory";

  try {
    if (provider === "libretranslate") {
      return await translateWithLibreTranslate(text.trim());
    }

    return await translateWithMyMemory(text.trim());
  } catch (error) {
    console.log("======== translateRuToEn =========");
    console.log(error);
    return "";
  }
}

async function fillEnglishField(data, sourceKey, targetKey) {
  if (hasText(data[targetKey]) || !hasText(data[sourceKey])) {
    return data;
  }

  const translatedText = await translateRuToEn(data[sourceKey]);

  if (!translatedText) return data;

  return {
    ...data,
    [targetKey]: translatedText,
  };
}

async function withAutoServiceEnglish(data) {
  let nextData = { ...data };

  nextData = await fillEnglishField(nextData, "title", "titleEn");
  nextData = await fillEnglishField(nextData, "description", "descriptionEn");

  return nextData;
}

async function withAutoProfileEnglish(data) {
  let nextData = { ...data };

  nextData = await fillEnglishField(nextData, "title", "titleEn");
  nextData = await fillEnglishField(nextData, "description", "descriptionEn");
  nextData = await fillEnglishField(nextData, "category", "categoryEn");

  return nextData;
}

module.exports = {
  translateRuToEn,
  withAutoProfileEnglish,
  withAutoServiceEnglish,
};
