import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { id: postId } = await params

  try {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: session.user.id, postId } },
    })

    if (existing) {
      // Unlike
      await prisma.like.delete({ where: { userId_postId: { userId: session.user.id, postId } } })
      await prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } })
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.like.create({ data: { userId: session.user.id, postId } })
      await prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Failed to toggle like:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}
