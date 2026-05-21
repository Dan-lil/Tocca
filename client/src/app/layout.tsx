import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import "./globals.css";
import StoreProvider from "./store/storeProvider";
import AppHeader from "@/shared/ui/AppHeader/AppHeader";
import AppFooter from "@/shared/ui/AppFooter/AppFooter";
import GlobalBookingModal from "@/shared/ui/GlobalBookingModal/GlobalBookingModal";

export const metadata: Metadata = {
  title: "Tocca",
  description: "Tocca",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StoreProvider>
            <div className="site-shell">
              <AppHeader />
              <div className="site-content">{children}</div>
              <AppFooter />
              <GlobalBookingModal />
            </div>
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
