import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тест геопоиска",
};

export default function TestGeoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
