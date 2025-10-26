import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SPC Telemetry",
  description: "Created by SPC",
  icons: {
    icon: "/telemetryweb/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Next.js will inject favicon automatically using metadata */}
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
