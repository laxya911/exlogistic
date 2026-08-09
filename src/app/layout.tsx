import type { Metadata } from "next";
import { Toaster } from "sonner";
import { NextAuthProvider } from "@/components/providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExLogis ERP",
  description: "Global Export Matrix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <NextAuthProvider>
            {children}
            <Toaster position="bottom-right" />
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
