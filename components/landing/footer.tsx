"use client"

import Link from "next/link"
import { Sparkles, Github, Twitter, Linkedin } from "lucide-react"
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/constants"

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
  ],
  Resources: [
    { name: "Documentation", href: "/docs" },
    { name: "Blog", href: "/blog" },
    { name: "Support", href: "/support" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-white">{PRODUCT_NAME}</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-sm">
              {PRODUCT_TAGLINE}. Teach it your brand once — then get ideas and
              drafts that stay consistent.
            </p>
            <div className="flex items-center space-x-4 mt-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 mt-4 md:mt-0">
            Built for founders, by founders.
          </p>
        </div>
      </div>
    </footer>
  )
}
