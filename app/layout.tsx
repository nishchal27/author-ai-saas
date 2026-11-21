import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/react"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/toaster"
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/constants"

const inter = Inter({ subsets: ["latin"] })

const title = `${PRODUCT_NAME} — ${PRODUCT_TAGLINE}`
const description =
  "Teach Varabhi about your brand. Let it help you decide what to create and produce consistent marketing content for small businesses and solo founders."

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description,
  applicationName: PRODUCT_NAME,
  keywords: [
    "Varabhi",
    "brand marketing",
    "AI marketing workspace",
    "content ideas",
    "brand voice",
    "small business marketing",
    "content planner",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    siteName: PRODUCT_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
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
