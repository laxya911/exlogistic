import type { Metadata } from "next";
import { Toaster } from "sonner";
import { NextAuthProvider } from "@/components/providers";
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
    <html lang="en">
      <body className="antialiased">
        <NextAuthProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" />
        </NextAuthProvider>
      </body>
    </html>
  );
}
