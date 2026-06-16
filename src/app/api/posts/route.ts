import { auth } from "@/auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { NextRequest, NextResponse } from "next/server"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// GET — community feed
export async function GET() {
  try {
    const session = await auth()
    const posts = await convex.query(api.posts.getPublicFeed, {
      userId: session?.user?.id ?? undefined,
    })
    return NextResponse.json(posts)
  } catch (error) {
    console.error("Failed to load feed:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}

// POST — share an outfit
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { caption, clothingIds } = await req.json()
  if (!clothingIds?.length) return NextResponse.json({ error: "No items selected" }, { status: 400 })

  try {
    const post = await convex.mutation(api.posts.create, {
      userId: session.user.id,
      userName: session.user.name ?? "Anonymous",
      userImage: session.user.image ?? undefined,
      caption: caption ?? undefined,
      clothingIds,
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Failed to share post:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}

