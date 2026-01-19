import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Founder OS - Founder-first Marketing & Visibility System",
  description: "Turn your real product activity into trust-building content without the marketing stress. No marketing expertise needed. No fake hype. Just your real work transformed into credible, conversion-ready content.",
  keywords: ["founder marketing", "SaaS marketing", "content generation", "founder tools", "marketing automation", "content creation"],
  openGraph: {
    title: "Founder OS - Founder-first Marketing & Visibility System",
    description: "Turn your real product activity into trust-building content without the marketing stress.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <body className={inter.className}>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
