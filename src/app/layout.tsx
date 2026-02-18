import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stardust",
  description: "Collect cosmic stardust, unlock hidden secrets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}