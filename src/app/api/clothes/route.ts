import { auth } from "@/auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { NextRequest, NextResponse } from "next/server"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  try {
    const clothes = await convex.query(api.clothing.get, { userId: session.user.id })
    return NextResponse.json(clothes)
  } catch (error) {
    console.error("Failed to load clothes:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}

// Now accepts imageUrl (string) instead of a file — upload happens in browser
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const body = await req.json()
  const { imageUrl, category = "top", color = "unknown" } = body

  if (!imageUrl) return NextResponse.json({ error: "No image URL" }, { status: 400 })

  try {
    const clothing = await convex.mutation(api.clothing.create, {
      userId: session.user.id,
      imageUrl,
      category,
      color,
      pattern: "solid",
      season: "all",
    })

    return NextResponse.json(clothing)
  } catch (error) {
    console.error("Failed to save clothing item:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}

