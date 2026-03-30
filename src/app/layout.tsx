import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app",
});

export const metadata: Metadata = {
  title: "NO Loan — Loan Management",
  description: "Internal loan tracking, schedules, and contracts",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "NO Loan",
    description: "Loan management for your team",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} print:h-auto print:min-h-0 print:overflow-visible`}
    >
      <body
        className={`${sans.className} min-h-screen bg-app bg-dot font-sans antialiased text-zinc-200 print:h-auto print:min-h-0 print:max-h-none print:overflow-visible`}
      >
        {children}
      </body>
    </html>
  );
}
