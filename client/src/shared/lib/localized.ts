type LocalizedContent = {
  title?: string | null;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  category?: string | null;
  categoryEn?: string | null;
};

const knownEnglishTitles: Record<string, string> = {
  "Ногти": "Nails",
  "Маникюр": "Manicure",
  "Педикюр": "Pedicure",
  "Волосы": "Hair",
  "Укладка": "Hair styling",
  "Окрашивание волос": "Hair coloring",
  "Косметология": "Cosmetology",
  "Эпиляция": "Hair removal",
  "Массаж": "Massage",
  "Массаж лица": "Face massage",
  "Массаж тела": "Body massage",
  "Макияж": "Makeup",
};

const knownEnglishDescriptions: Record<string, string> = {
  "Маникюр и аккуратный уход за ногтями": "Manicure and neat nail care",
  "Аккуратный маникюр с ухоженной формой и стойким покрытием":
    "Neat manicure with shaped nails and long-lasting polish",
  "Уход за ногами и ногтями": "Foot and nail care",
  "Укладка и образ для любого события": "Styling and a look for any occasion",
  "Профессиональная укладка волос": "Professional hair styling",
  "Мягкое окрашивание и обновление образа с учетом структуры волос":
    "Gentle coloring and a fresh look tailored to hair structure",
  "Уход за кожей лица и свежий тон": "Facial skin care and a fresh tone",
  "Классическая эпиляция бикини и депиляция": "Classic bikini hair removal and depilation",
  "Расслабляющий массаж для лица и тела": "Relaxing face and body massage",
  "Расслабляющий массаж для лица и шеи": "Relaxing face and neck massage",
  "Расслабляющий массаж для всего тела": "Relaxing full body massage",
  "Легкий и выразительный макияж под образ": "Light, expressive makeup for your look",
};

function pickEnglishValue(value?: string | null) {
  const trimmedValue = value?.trim();

  return trimmedValue || null;
}

function pickKnownEnglishValue(
  value: string | null | undefined,
  dictionary: Record<string, string>,
) {
  const trimmedValue = value?.trim();

  return trimmedValue ? dictionary[trimmedValue] ?? null : null;
}

export function getLocalizedTitle<T extends LocalizedContent>(item: T, locale: string) {
  return locale === "en"
    ? pickEnglishValue(item.titleEn) ?? pickKnownEnglishValue(item.title, knownEnglishTitles) ?? item.title
    : item.title;
}

export function getLocalizedDescription<T extends LocalizedContent>(item: T, locale: string) {
  return locale === "en"
    ? pickEnglishValue(item.descriptionEn) ??
        pickKnownEnglishValue(item.description, knownEnglishDescriptions) ??
        item.description
    : item.description;
}

export function getLocalizedCategory<T extends LocalizedContent>(item: T, locale: string) {
  return locale === "en"
    ? pickEnglishValue(item.categoryEn) ??
        pickKnownEnglishValue(item.category, knownEnglishTitles) ??
        item.category
    : item.category;
}
