import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarroUs — 플리 한 장",
  description: "Spotify 플레이리스트를 한 장의 매거진으로 다시 묶어 공유합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="light">
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
