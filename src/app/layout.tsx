import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthRouteHeader } from "@/components/AuthRouteHeader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

function getMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "COOT Ai — AI 바로가기",
  description: "자주 쓰는 AI 서비스를 카테고리별로 모아 두고, 링크를 편집·정렬할 수 있습니다.",
  icons: {
    icon: [{ url: "/logo/coot-mascot.svg", type: "image/svg+xml" }],
    apple: "/logo/coot-mascot.svg",
  },
  openGraph: {
    title: "COOT Ai — AI 바로가기",
    description: "자주 쓰는 AI 서비스를 카테고리별로 모아 두고, 링크를 편집·정렬할 수 있습니다.",
    images: [{ url: "/logo/coot-header-logo.svg", width: 512, height: 512, alt: "COOT Ai" }],
  },
  twitter: {
    card: "summary",
    title: "COOT Ai — AI 바로가기",
    images: ["/logo/coot-header-logo.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#010101",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} min-h-full bg-coot-bg`}
      style={{ backgroundColor: "#010101", color: "#f3efea" }}
    >
      <body
        className="flex min-h-dvh flex-col bg-coot-bg font-sans text-coot-text antialiased"
        style={{ backgroundColor: "#010101", color: "#f3efea" }}
      >
        <AuthRouteHeader />
        <main className="min-h-0 w-full min-w-0 flex-1 self-stretch overflow-x-hidden">{children}</main>
      </body>
    </html>
  );
}
