import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/api/query-client";
import { ErrorBoundary } from "@/components/error-boundary";
import { Analytics } from '@/lib/performance/analytics';
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
  title: "年会抽奖系统",
  description: "年会抽奖系统 - 基于 Next.js 的全栈抽奖应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <QueryProvider>
            {children}
            <Toaster />
            {/* 性能监控 */}
            <Analytics />
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
