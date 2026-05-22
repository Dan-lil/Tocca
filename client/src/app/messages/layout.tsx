import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сообщения",
};

export default function MessagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
