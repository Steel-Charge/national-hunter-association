import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import StoreInitializer from "@/components/StoreInitializer";
import { PWAProvider } from "@/context/PWAContext";
import NewTitleHandler from "@/components/NewTitleHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Global Hunters Association",
  description: "The official app for the Global Hunters Association.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NHA",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#00e5ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <StoreInitializer />
        <PWAProvider>
          <BackgroundWrapper>
            <NewTitleHandler />
            {children}
          </BackgroundWrapper>
        </PWAProvider>
      </body>
    </html>
  );
}
