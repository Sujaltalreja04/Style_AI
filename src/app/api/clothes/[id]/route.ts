import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const updated = await prisma.clothing.update({
      where: { id, userId: session.user.id },
      data: {
        category: body.category,
        color: body.color,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update clothing item:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}
