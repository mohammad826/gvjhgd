import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TelegramProvider } from "@/providers/TelegramProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Watch & Earn | Telegram Mini App",
  description: "Earn rewards by watching ads, completing tasks, and referring friends on Telegram.",
  openGraph: {
    title: "Watch & Earn",
    description: "Earn rewards by watching ads on Telegram",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Script
          src="//libtl.com/sdk.js"
          data-zone="11017565"
          data-sdk="show_11017565"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className} bg-[#f0f0f0] dark:bg-[#111827] text-[#000000] dark:text-[#f9fafb] h-full overflow-hidden`}>
        <TelegramProvider>
          <main className="h-full flex flex-col overflow-y-auto">
            {children}
          </main>
        </TelegramProvider>
      </body>
    </html>
  );
}