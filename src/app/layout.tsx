import type { Metadata } from "next";
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
        {children}
      </body>
    </html>
  );
}
