import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AgentHub — AI DeFi Agents on Polkadot Hub",
  description:
    "Trust-minimized AI DeFi agents on Polkadot Hub. The AI drives. The Guardian holds the brakes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans bg-[#0a0a0a] text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
