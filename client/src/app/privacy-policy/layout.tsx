import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
};

export default function PrivacyPolicyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
