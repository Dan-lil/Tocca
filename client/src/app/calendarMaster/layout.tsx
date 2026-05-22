import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Календарь мастера",
};

export default function CalendarMasterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
