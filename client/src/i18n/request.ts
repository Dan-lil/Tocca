import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale } from "@/i18n/config";

export default getRequestConfig(async () => {
  const savedLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = isLocale(savedLocale) ? savedLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
