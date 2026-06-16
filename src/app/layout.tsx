import type { Metadata } from "next"
import { Geist } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import AuthProvider from "@/components/AuthProvider"
import ConvexClientProvider from "@/components/ConvexClientProvider"
import AuthButton from "@/components/AuthButton"
import NavLinks from "@/components/NavLinks"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Style AI — Your Personal Stylist",
  description: "AI-powered outfit suggestions based on your wardrobe, body type, and events.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen flex flex-col bg-white text-zinc-900">
        <AuthProvider>
          <ConvexClientProvider>

            {/* NAVBAR */}
            <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
              <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">S</span>
                  </div>
                  <span className="font-semibold text-zinc-900 text-lg">Style AI</span>
                </Link>

                {/* Nav links — hidden on landing page for non-logged-in users */}
                <NavLinks />

                <AuthButton />

              </div>
            </header>

            {/* PAGE CONTENT */}
            <main className="flex-1">
              {children}
            </main>

          </ConvexClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

