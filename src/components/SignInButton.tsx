"use client"

import { signIn } from "next-auth/react"

export default function SignInButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className={className}>
      {children}
    </button>
  )
}
