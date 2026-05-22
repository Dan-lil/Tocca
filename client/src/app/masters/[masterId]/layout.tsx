import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль мастера",
};

export default function MasterPublicProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
