import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DoppApp",
  description: "Hayalindeki ürünleri sepete ekle, siparişini oluştur ve paylaş!",
  openGraph: {
    title: "DoppApp",
    description: "Hayalindeki ürünleri sepete ekle, siparişini oluştur ve paylaş!",
    url: "https://doppapp.com",
    siteName: "DoppApp",
    images: [
      {
        url: "https://doppapp.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "DoppApp",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DoppApp",
    description: "Hayalindeki ürünleri sepete ekle, siparişini oluştur ve paylaş!",
    images: ["https://doppapp.com/og-image.png"],
  },
  icons: {
    icon: "/images/doppapp-logo-tek.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
