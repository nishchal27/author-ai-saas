import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/react"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/toaster"
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/constants"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} - ${PRODUCT_TAGLINE}`,
  description:
    "Teach Varabhi about your brand. Get clear guidance on what to create and platform-specific drafts that stay on-brand — without a marketing team.",
  keywords: [
    "brand marketing",
    "AI content",
    "marketing workspace",
    "brand voice",
    "content drafts",
    "small business marketing",
  ],
  openGraph: {
    title: `${PRODUCT_NAME} - ${PRODUCT_TAGLINE}`,
    description:
      "Teach Varabhi about your brand. Decide what to create and produce consistent, on-brand marketing content.",
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
            <Analytics />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
