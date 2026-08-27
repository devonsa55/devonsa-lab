import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
