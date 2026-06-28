import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";  // 👈 add this

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProdForge — AI Productivity Engine",
  description: "AI-powered task execution and deadline intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={geist.className}>
        <Providers>          {/* 👈 wrap children */}
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}