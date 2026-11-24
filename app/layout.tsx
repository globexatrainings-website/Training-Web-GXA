import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Training Video Portal",
  description: "Training videos and learning resources",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
