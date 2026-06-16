import { auth } from "@/auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../../convex/_generated/api"
import { Id } from "../../../../../convex/_generated/dataModel"
import { NextRequest, NextResponse } from "next/server"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const updated = await convex.mutation(api.clothing.update, {
      id: id as Id<"clothing">,
      userId: session.user.id,
      category: body.category,
      color: body.color,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update clothing item:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}

