import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "What Is This? - Learn English Vocabulary with Fun Pictures",
  description:
    "Learn English vocabulary with fun pictures! This game will help you learn English words by showing you pictures of them.",
  keywords: [
    "English",
    "Vocabulary",
    "Learn English",
    "English Learning",
    "English Games",
    "English Fun",
    "English Pictures",
  ],
  authors: [{ name: "What Is This?" }],
  icons: {
    icon: "/favicon.ico",
  },
  twitter: {
    card: "summary_large_image",
    title: "What Is This? - Learn English Vocabulary with Fun Pictures",
    description:
      "Learn English vocabulary with fun pictures! This game will help you learn English words by showing you pictures of them.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
