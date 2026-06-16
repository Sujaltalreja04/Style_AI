import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// GET — community feed
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 50,
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
    // Get the first clothing item's image as the cover
    const firstItem = await prisma.clothing.findFirst({
      where: { id: clothingIds[0], userId: session.user.id },
    })
    if (!firstItem) return NextResponse.json({ error: "Item not found" }, { status: 404 })

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        userName: session.user.name ?? "Anonymous",
        userImage: session.user.image ?? null,
        caption: caption ?? null,
        coverImage: firstItem.imageUrl,
        clothingIds,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Failed to share post:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}
