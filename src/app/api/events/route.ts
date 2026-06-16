import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { suggestOutfit } from "@/lib/groq"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { event } = await req.json()
  if (!event) return NextResponse.json({ error: "No event provided" }, { status: 400 })

  let wardrobe
  try {
    wardrobe = await prisma.clothing.findMany({
      where: { userId: session.user.id },
      select: { id: true, category: true, color: true, imageUrl: true },
    })
  } catch (error) {
    console.error("Failed to load wardrobe for events:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }

  let suggestion
  try {
    suggestion = await suggestOutfit(event, wardrobe)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Groq error:", msg)
    return NextResponse.json({ error: "AI error: " + msg }, { status: 500 })
  }

  const outfitWithImages = (suggestion.outfit ?? []).map((pick: { id: string; reason: string }) => {
    const item = wardrobe.find(w => w.id === pick.id)
    return { ...pick, item }
  }).filter((p: { item: unknown }) => p.item)

  return NextResponse.json({
    outfit: outfitWithImages,
    missing: suggestion.missing ?? [],
    tip: suggestion.tip ?? "",
  })
}
