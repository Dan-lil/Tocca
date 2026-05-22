import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои записи",
};

export default function CalendarClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
