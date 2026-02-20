import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { AppShell } from "@/components/layout/AppShell";
import { Web3Provider } from "@/components/web3-provider";
import { config } from "@/lib/wagmi";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(
    config,
    (await headers()).get("cookie")
  );

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider initialState={initialState}>
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
