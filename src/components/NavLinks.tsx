"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/dashboard",  label: "Dashboard" },
  { href: "/wearboard",  label: "Wearboard" },
  { href: "/events",     label: "Events" },
  { href: "/photo",      label: "Photo" },
  { href: "/shop",       label: "Shop" },
  { href: "/insights",   label: "Insights" },
  { href: "/feed",       label: "Feed" },
]

export default function NavLinks() {
  const { status } = useSession()
  const pathname = usePathname()

  // Only show nav links when logged in
  if (status !== "authenticated") return null

  return (
    <nav className="hidden sm:flex items-center gap-1">
      {LINKS.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            pathname === link.href
              ? "bg-zinc-100 text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
