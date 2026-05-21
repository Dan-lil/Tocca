type LocalizedContent = {
  title?: string | null;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  category?: string | null;
  categoryEn?: string | null;
};

function pickEnglishValue(value?: string | null) {
  const trimmedValue = value?.trim();

  return trimmedValue || null;
}

export function getLocalizedTitle<T extends LocalizedContent>(item: T, locale: string) {
  return locale === "en" ? pickEnglishValue(item.titleEn) ?? item.title : item.title;
}

export function getLocalizedDescription<T extends LocalizedContent>(item: T, locale: string) {
  return locale === "en"
    ? pickEnglishValue(item.descriptionEn) ?? item.description
    : item.description;
}

export function getLocalizedCategory<T extends LocalizedContent>(item: T, locale: string) {
  return locale === "en" ? pickEnglishValue(item.categoryEn) ?? item.category : item.category;
}
