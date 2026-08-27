import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JOSE DEMO — Stream sin límites",
  description:
    "JOSE DEMO: películas, series y canales en vivo. Stream sin límites en cualquier dispositivo.",
  keywords: ["JOSE DEMO", "streaming", "películas", "series", "canales en vivo", "Netflix"],
  authors: [{ name: "JOSE DEMO" }],
  manifest: undefined,
  openGraph: {
    title: "JOSE DEMO",
    description: "Stream sin límites. Películas, series y canales en vivo.",
    siteName: "JOSE DEMO",
    type: "website",
    locale: "es_AR",
  },
};

export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
