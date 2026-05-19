import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "./store/storeProvider";
import AppHeader from "@/shared/ui/AppHeader/AppHeader";
import AppFooter from "@/shared/ui/AppFooter/AppFooter";
import GlobalBookingModal from "@/shared/ui/GlobalBookingModal/GlobalBookingModal";

export const metadata: Metadata = {
  title: "Tossa",
  description: "Tossa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <StoreProvider>
          <div className="site-shell">
            <AppHeader />
            <div className="site-content">{children}</div>
            <AppFooter />
            {/* Глобальная AI-модалка доступна на всех страницах приложения */}
            <GlobalBookingModal />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
