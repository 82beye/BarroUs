import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarroUs",
  description: "노드 그래프 기반 텍스트 SNS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
