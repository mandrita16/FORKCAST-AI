import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "FORKCAST-AI | AI-Powered Forecasting Assistant",
  description:
    "Chat with FORKCAST-AI, your intelligent forecasting assistant. Get AI-powered insights for trend analysis, predictions, and data-driven business decisions.",
  keywords: ["AI", "forecasting", "chatbot", "business intelligence", "trend analysis", "predictions"],
  authors: [{ name: "FORKCAST-AI Team" }],
  creator: "FORKCAST-AI",
  publisher: "FORKCAST-AI",
  robots: "index, follow",
  openGraph: {
    title: "FORKCAST-AI | AI-Powered Forecasting Assistant",
    description: "Chat with FORKCAST-AI for intelligent business forecasting and trend analysis",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FORKCAST-AI | AI-Powered Forecasting Assistant",
    description: "Chat with FORKCAST-AI for intelligent business forecasting and trend analysis",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#000000",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>{children}</body>
    </html>
  )
}
