import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import WellgroveUpdates from "@/components/WellgroveUpdates";

export const metadata: Metadata = {
  title: {
    default: "Avobloom · 每日健康记录",
    template: "%s · Avobloom",
  },
  description: "记录每日体重、排便、饮食重量与三大营养素。",
  applicationName: "Avobloom",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Avobloom",
  },
  manifest: "/manifest.webmanifest",
  icons: {icon: "/brand/avobloom-icon-v2.png", apple: "/apple-icon.png"},
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f0e2",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
        <body className="min-h-full wellgrove-wenkai">
          {children}
          <WellgroveUpdates/>
        </body>
    </html>
  );
}
