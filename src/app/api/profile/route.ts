import { auth } from "@/auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { NextRequest, NextResponse } from "next/server"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://dummy-url.convex.cloud")

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(null)

  try {
    const profile = await convex.query(api.userProfiles.get, { userId: session.user.id })
    return NextResponse.json(profile)
  } catch (error) {
    console.error("Failed to load profile:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const body = await req.json()

  try {
    const profile = await convex.mutation(api.userProfiles.save, {
      userId: session.user.id,
      bodyType: body.bodyType,
      skinTone: body.skinTone,
      budgetTier: body.budgetTier,
      budgetMax: body.budgetMax,
      stylePrefs: body.stylePrefs,
      events: body.events,
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Failed to save profile:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}

