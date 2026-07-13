import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MobileAppShell from "@/components/MobileAppShell";
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
  title: {
    default: "Expense Tracker AI",
    template: "%s · Expense Tracker AI",
  },
  description: "Capture purchases, understand patterns, and keep a clearer personal ledger with AI.",
  applicationName: "Expense Tracker AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Expenses",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1f382b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
        <body className="min-h-full">
          {children}
          <MobileAppShell />
        </body>
    </html>
  );
}
