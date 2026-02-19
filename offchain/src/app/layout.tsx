import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { Web3Provider } from "@/components/web3-provider";
import { MarketplaceProvider } from "@/context/MarketplaceContext";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Necto - Institutional DePIN Interface",
  description: "Financial terminal for institutional compute procurement across decentralized networks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          <MarketplaceProvider>
            <AppShell>
              {children}
            </AppShell>
            <Toaster />
          </MarketplaceProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
