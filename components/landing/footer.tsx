"use client"

import Link from "next/link"
import { Target } from "lucide-react"
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground">{PRODUCT_NAME}</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {PRODUCT_TAGLINE}. Teach it your brand once — then decide what to create
              and draft on-brand content.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-primary">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="#who" className="hover:text-primary">
                    Who it’s for
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Account</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/sign-up" className="hover:text-primary">
                    Start free
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="hover:text-primary">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Contact</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="mailto:hello@varabhi.com"
                    className="hover:text-primary"
                  >
                    hello@varabhi.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
