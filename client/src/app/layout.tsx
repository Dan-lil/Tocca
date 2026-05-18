import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "./store/storeProvider";
import AppHeader from "@/shared/ui/AppHeader/AppHeader";
import AppFooter from "@/shared/ui/AppFooter/AppFooter";
import GlobalBookingModal from "@/shared/ui/GlobalBookingModal/GlobalBookingModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tocca",
  description: "Tocca",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <StoreProvider>
          {/* Layout держит общую шапку, футер и глобальную модалку для всех страниц */}
          <div className="site-shell">
            <AppHeader />
            <div className="site-content">{children}</div>
            <AppFooter />
            {/* Глобальная модалка нужна и для AI сценария, и для прямой записи */}
            <GlobalBookingModal />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
