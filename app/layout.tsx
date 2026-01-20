import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shop Manager - Inventory",
  description: "Modern Inventory Management System",
};

import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Suspense } from "react";
import { ThemeProvider } from "@/lib/theme-provider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${notoSansBengali.variable}`}>
      <body
        className={`antialiased bg-background text-foreground transition-colors duration-200 font-sans`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
              {/* Fixed Navbar (width and offset handled in Navbar component) */}
              <Navbar />

              <div className="flex flex-1">
                {/* Fixed Sidebar (full-height handles its own positioning) */}
                <Sidebar />

                {/* Main content area shifted by sidebar width and cleared by navbar height */}
                <main className="flex-1 w-full md:ml-64 pt-16 transition-all duration-300">
                  <div className="px-4 py-8 md:px-10 max-w-[1920px] mx-auto w-full">
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="animate-pulse text-muted-foreground font-bengali">লোড হচ্ছে...</div>
                      </div>
                    }>
                      {children}
                    </Suspense>
                  </div>
                </main>
              </div>
            </div>
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
