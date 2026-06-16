import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  let clothes
  try {
    clothes = await prisma.clothing.findMany({
      where: { userId: session.user.id },
      select: { category: true, color: true, pattern: true, season: true, createdAt: true },
    })
  } catch (error) {
    console.error("Failed to load insights:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }

  if (clothes.length === 0) {
    return NextResponse.json({ empty: true })
  }

  // Color breakdown
  const colorCount: Record<string, number> = {}
  for (const c of clothes) {
    colorCount[c.color] = (colorCount[c.color] ?? 0) + 1
  }
  const topColors = Object.entries(colorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color, count]) => ({ color, count, pct: Math.round(count / clothes.length * 100) }))

  // Category breakdown
  const categoryCount: Record<string, number> = {}
  for (const c of clothes) {
    categoryCount[c.category] = (categoryCount[c.category] ?? 0) + 1
  }
  const categories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }))

  // Pattern breakdown
  const patternCount: Record<string, number> = {}
  for (const c of clothes) {
    patternCount[c.pattern] = (patternCount[c.pattern] ?? 0) + 1
  }
  const topPattern = Object.entries(patternCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "solid"

  // Season breakdown
  const seasonCount: Record<string, number> = {}
  for (const c of clothes) {
    seasonCount[c.season] = (seasonCount[c.season] ?? 0) + 1
  }

  // Missing categories check
  const allCategories = ["top", "bottom", "dress", "shoes", "outerwear", "accessory"]
  const missing = allCategories.filter(cat => !categoryCount[cat])

  // Style DNA label
  const dominantColor = topColors[0]?.color ?? "neutral"
  const isDark = ["black", "navy", "dark", "charcoal"].some(d => dominantColor.includes(d))
  const isColorful = topColors.filter(c => !["black", "white", "grey", "gray", "beige"].includes(c.color)).length >= 2
  const styleDna = isDark ? "Dark & Minimal" : isColorful ? "Bold & Colourful" : "Clean & Neutral"

  return NextResponse.json({
    total: clothes.length,
    topColors,
    categories,
    topPattern,
    seasonCount,
    missing,
    styleDna,
    dominantColor,
  })
}
