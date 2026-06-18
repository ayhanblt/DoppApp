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
  description: "İşte benim DoppApp sepetim! Gerçek olsaydı ilk hangi ürünü alırdım dersin? #DoppApp",
  openGraph: {
    title: "DoppApp",
    description: "İşte benim DoppApp sepetim! Gerçek olsaydı ilk hangi ürünü alırdım dersin? #DoppApp",
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
    description: "İşte benim DoppApp sepetim! Gerçek olsaydı ilk hangi ürünü alırdım dersin? #DoppApp",
    images: ["https://doppapp.com/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
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
