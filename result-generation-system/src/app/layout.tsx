import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Result Generation System",
  description: "Complete school result management system for Nigerian schools",
  // Add the icons object here
  icons: {
    icon: "/Result Generation System.jpg", // Points to public/logo.png
    // apple: "/apple-touch-icon.png", // Optional: for Apple devices
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}