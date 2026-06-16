import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(null)

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })
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
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: { ...body, updatedAt: new Date() },
      create: { userId: session.user.id, ...body },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Failed to save profile:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }
}
