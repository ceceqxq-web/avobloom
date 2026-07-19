import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mori · AI Health Coach",
    template: "%s · Mori",
  },
  description: "用文字、语音或照片，轻松记录体重、饮食与运动。",
  applicationName: "Mori Health",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mori",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f4f3ee",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
        <body className="min-h-full">
          {children}
        </body>
    </html>
  );
}
