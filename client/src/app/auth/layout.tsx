import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация и вход",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
