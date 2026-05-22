import type { Metadata } from "next";

import "./page.css";

export const metadata: Metadata = {
  title: "Личный кабинет",
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
