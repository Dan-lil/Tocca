import type { Metadata } from "next";

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
