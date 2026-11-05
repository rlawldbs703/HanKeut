import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "한끗차이 | THINK ARENA",
  description: "AI와 현실 대화 상황에서 대결하며 스스로 생각하고 표현하는 힘을 키우는 AI 사고력 게임",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-muted/30">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="py-6 text-center text-xs text-muted-foreground">
          한끗차이 · THINK ARENA — 교내 GPU(틸론) 기반 AI 사고력 게임
        </footer>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
