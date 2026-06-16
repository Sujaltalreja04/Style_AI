import { auth } from "@/auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { NextRequest, NextResponse } from "next/server"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { id: postId } = await params

  try {
    const res = await convex.mutation(api.likes.toggle, {
      userId: session.user.id,
      postId: postId as Id<"posts">,
    })

    return NextResponse.json({ liked: res.liked })
  } catch (error) {
    console.error("Failed to toggle like:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}

