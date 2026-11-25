import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Globexa Immigration | Training Portal",
  description: "Globexa Immigration Training Video Library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
