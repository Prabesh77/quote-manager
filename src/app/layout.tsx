import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout";
import DashboardSidebar from "@/components/ui/DashboardSidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SnackbarProvider } from "@/components/ui/Snackbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quote Manager",
  description: "Manage quotes and orders efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <SnackbarProvider>
            <Navigation />
            <DashboardSidebar />
            <main className="min-h-screen bg-gray-50">
              <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </SnackbarProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
