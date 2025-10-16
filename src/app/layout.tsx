import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atelier Cookpad",
  description: "アトリエシリーズの調合サポートツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head />
      <body>
        <div className="container mx-auto px-4">{children}</div>
      </body>
    </html>
  );
}
