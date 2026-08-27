import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono, Instrument_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const instrumentSansHeading = Instrument_Sans({subsets:['latin'],variable:'--font-heading'});

const geistMono = Geist_Mono({subsets:['latin'],variable:'--font-mono'});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "MCP Multi-Surface Demo",
  description: "One MCP tool call. Two native renders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn( geist.variable, "font-mono", geistMono.variable, instrumentSansHeading.variable)}>
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
