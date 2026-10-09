import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { ConfigStatus } from "@/components/config-status";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Decision Playground",
  description: "Learn the OpenAI Decisions API by scoring a resume against a job description.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <Suspense fallback={null}>
            <ConfigStatus />
          </Suspense>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
