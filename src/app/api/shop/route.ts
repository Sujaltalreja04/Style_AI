import { auth } from "@/auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import Groq from "groq-sdk"
import { NextRequest, NextResponse } from "next/server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy-key-for-build" })
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://dummy-url.convex.cloud")

const PRICE_RANGES: Record<string, string> = {
  budget: "under $30",
  mid: "$30 to $100",
  premium: "over $100",
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { budget = "mid", reason = "wardrobe gaps" } = await req.json()

  let wardrobe: any[] = []
  try {
    wardrobe = await convex.query(api.clothing.get, { userId: session.user.id }) || []
  } catch (error) {
    console.error("Failed to load wardrobe for shop:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }


  const allCategories = ["top", "bottom", "shoes", "outerwear", "accessory", "dress"]
  const ownedCategories = [...new Set(wardrobe.map(c => c.category))]
  const missingCategories = allCategories.filter(c => !ownedCategories.includes(c))
  const ownedColors = [...new Set(wardrobe.map(c => c.color))].slice(0, 5)

  const wardrobeSummary = wardrobe.length === 0
    ? "User has no wardrobe items yet."
    : `Owns: ${ownedCategories.join(", ")}. Favourite colours: ${ownedColors.join(", ")}. Missing: ${missingCategories.join(", ") || "nothing"}.`

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 600,
    messages: [
      {
        role: "system",
        content: `You are a personal shopper. Generate 6 specific clothing/accessory items to buy.
Price range: ${PRICE_RANGES[budget]}.
Focus on: ${reason}.
Return ONLY valid JSON array:
[
  {
    "name": "specific item name (e.g. 'White linen button-down shirt')",
    "category": "category",
    "reason": "why they need this (max 10 words)",
    "searchQuery": "google shopping search terms (3-5 words)",
    "estimatedPrice": "$XX"
  }
]`,
      },
      {
        role: "user",
        content: `Wardrobe: ${wardrobeSummary}`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content ?? "[]"
  try {
    const match = text.match(/\[[\s\S]*\]/)
    const items = JSON.parse(match?.[0] ?? "[]")
    const itemsWithLinks = items.map((item: { searchQuery: string }) => ({
      ...item,
      shopUrl: `https://www.google.com/search?q=${encodeURIComponent(item.searchQuery)}&tbm=shop`,
    }))
    return NextResponse.json({ items: itemsWithLinks, missingCategories })
  } catch {
    return NextResponse.json({ items: [], missingCategories })
  }
}
