import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UWC Connect | Campus Events & Opportunities",
  description: "Mobile-first social platform for University of the Western Cape students and staff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col md:flex-row">
            {/* Desktop Navigation Sidebar */}
            <Navbar />

            {/* Main Application Container */}
            <main className="flex-1 pb-20 md:pb-8 pt-0 md:pt-4 px-3 sm:px-6 max-w-4xl mx-auto w-full">
              {children}
            </main>

            {/* Mobile Navigation Bottom Bar */}
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
