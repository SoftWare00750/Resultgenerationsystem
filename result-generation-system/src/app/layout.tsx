import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Inter is kept only as a *fallback* (via CSS var) in case the licensed Gilroy
// font files haven't been added yet — see /public/fonts/README.md. The
// primary typeface is Gilroy, declared with @font-face in globals.css.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Result Generation System",
  description: "Complete school result management system for Nigerian schools",
  icons: {
    icon: "/images/Result%20Generation%20System.jpg",
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}