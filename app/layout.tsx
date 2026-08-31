import type { Metadata } from "next";
import "./globals.css";
import { Plus_Jakarta_Sans, Inter, IBM_Plex_Mono, Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

const serifFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MCP Multi-Surface Demo",
  description: "One MCP tool call. Two native renders.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
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
      className={cn(
        inter.variable,
        plusJakartaSans.variable,
        ibmPlexMono.variable,
        serifFont.variable
      )}
    >
      <body className="min-h-screen antialiased bg-[var(--brand-bg)] text-[var(--brand-fg)] font-sans">
        {children}
      </body>
    </html>
  );
}
