import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ValueProposition } from "@/components/landing/value-proposition"
import { Pricing } from "@/components/landing/pricing"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default async function LandingPage() {
  const { userId } = await auth()

  // If user is signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <ValueProposition />
        <Pricing />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
