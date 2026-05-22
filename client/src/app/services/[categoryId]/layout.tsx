import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мастера категории",
};

export default function ServicesCategoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
