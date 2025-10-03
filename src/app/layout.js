import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import ConfigStatus from "../components/ConfigStatus";
import AuthErrorBoundary from "../components/AuthErrorBoundary";
import PerformanceMonitor from "../components/PerformanceMonitor";
import ErrorBoundary from "../components/ErrorBoundary";
import AuthDebug from "../components/AuthDebug";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Token Website - Secure Digital Wallet Platform",
  description: "Experience lightning-fast crypto trading with institutional-grade security. Join thousands of traders who trust our platform for secure digital wallet management.",
  keywords: "digital wallet, cryptocurrency, secure trading, blockchain, crypto platform, token management",
  authors: [{ name: "Token Website Team" }],
  creator: "Token Website",
  publisher: "Token Website",
  robots: "index, follow",
  metadataBase: new URL('https://token-website.com'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://token-website.com",
    siteName: "Token Website",
    title: "Token Website - Secure Digital Wallet Platform",
    description: "Experience lightning-fast crypto trading with institutional-grade security.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Token Website - Secure Digital Wallet Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Token Website - Secure Digital Wallet Platform",
    description: "Experience lightning-fast crypto trading with institutional-grade security.",
    images: ["/og-image.jpg"],
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <AuthErrorBoundary>
            <AuthProvider>
              {children}
              <ConfigStatus />
              <PerformanceMonitor />
              <AuthDebug />
            </AuthProvider>
          </AuthErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
