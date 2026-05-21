const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const bundledMasterAvatarIds = new Set([2, 6, 7, 8, 10, 11, 12, 13, 14]);

type PortfolioSourceItem = {
  id: string;
  imageUrl: string;
  title: string;
};

export type ExpandedPortfolioItem = {
  id: string;
  sourceId: string;
  imageUrl: string;
  title: string;
};

export function getMediaUrl(value?: string | null) {
  if (!value) return "";

  if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${apiBaseUrl}${value}`;
  }

  return value;
}

export function getBundledMasterAvatarPath(masterId: number) {
  // Для мастеров с подготовленными файлами берем аватар напрямую из server/src/public/avatar
  if (!bundledMasterAvatarIds.has(masterId)) {
    return "";
  }

  return `/avatar/userId${masterId}.jpg`;
}

export function getMasterAvatarUrl(masterId: number, avatar?: string | null) {
  // Локальный аватар из public приоритетнее, чтобы не зависеть от старых ссылок в базе
  const bundledAvatarPath = getBundledMasterAvatarPath(masterId);

  if (bundledAvatarPath) {
    return getMediaUrl(bundledAvatarPath);
  }

  return getMediaUrl(avatar);
}

export function expandPortfolioItems(items: PortfolioSourceItem[]): ExpandedPortfolioItem[] {
  return items.flatMap((item) =>
    item.imageUrl
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((imageUrl, index) => ({
        id: `${item.id}-${index}`,
        sourceId: item.id,
        imageUrl,
        title: item.title,
      })),
  );
}
