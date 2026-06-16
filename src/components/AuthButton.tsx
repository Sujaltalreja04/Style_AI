"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"
import { useState } from "react"

export default function AuthButton() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  if (status === "loading") {
    return <div className="w-20 h-9 rounded-full bg-zinc-100 animate-pulse" />
  }

  if (session?.user) {
    return (
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors"
        >
          {session.user.image && (
            <Image src={session.user.image} alt="avatar" width={28} height={28} className="rounded-full" />
          )}
          <span className="text-sm font-medium text-zinc-900">{session.user.name?.split(" ")[0]}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-52 bg-white border border-zinc-100 rounded-2xl shadow-lg p-2 z-50">
            <div className="px-3 py-2 border-b border-zinc-100 mb-1">
              <p className="text-sm font-medium text-zinc-900">{session.user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 border border-zinc-200 rounded-full hover:bg-zinc-50 transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Sign in with Google
    </button>
  )
}
