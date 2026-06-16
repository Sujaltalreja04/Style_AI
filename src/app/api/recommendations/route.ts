import { auth } from "@/auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import Groq from "groq-sdk"
import { NextRequest, NextResponse } from "next/server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)


const BUDGET_RANGES: Record<string, { label: string; max: number }> = {
  student: { label: "under $25",    max: 25  },
  budget:  { label: "$25 to $60",   max: 60  },
  mid:     { label: "$60 to $180",  max: 180 },
  premium: { label: "$180 to $600", max: 600 },
  luxury:  { label: "over $600",    max: 9999 },
}

const SKIN_COLOURS: Record<string, string[]> = {
  spring: ["cream", "peach", "coral", "warm beige", "camel", "warm brown", "sage green", "golden yellow"],
  summer: ["lavender", "soft pink", "light blue", "rose", "mauve", "soft white", "powder blue"],
  autumn: ["rust", "olive", "mustard", "terracotta", "burnt orange", "dark brown", "forest green", "gold"],
  winter: ["black", "white", "navy", "royal blue", "emerald", "burgundy", "hot pink", "charcoal"],
}

const BODY_STYLE_RULES: Record<string, { recommend: string[]; note: string }> = {
  pear:              { recommend: ["A-line", "flared skirts", "wide-leg trousers", "V-neck tops", "structured shoulders", "wrap tops"], note: "highlight waist, balance hips with shoulders" },
  apple:             { recommend: ["empire waist", "flowy tops", "straight-leg trousers", "V-neck", "wrap dresses", "longline jackets"], note: "draw attention upward, elongate torso" },
  hourglass:         { recommend: ["fitted silhouettes", "wrap dresses", "pencil skirts", "belted styles", "bodycon", "peplum tops"], note: "define the waist" },
  rectangle:         { recommend: ["peplum tops", "ruffled tops", "belt-at-waist styles", "flared skirts", "layered looks", "cropped jackets"], note: "create curves with structure" },
  inverted_triangle: { recommend: ["wide-leg trousers", "A-line skirts", "flared jeans", "boat necks avoided", "V-necks", "detailed bottoms"], note: "balance shoulders with fuller bottoms" },
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { event, budget: budgetParam } = await req.json()

  // Get user profile + wardrobe
  let profile: { bodyType?: string; skinTone?: string; budgetTier?: string; stylePrefs?: string[] } | null = null
  let wardrobe: { id: string; category: string; color: string; imageUrl: string }[] = []
  try {
    const [rawProfile, rawWardrobe] = await Promise.all([
      convex.query(api.userProfiles.get, { userId: session.user.id }),
      convex.query(api.clothing.get, { userId: session.user.id }),
    ])
    profile = rawProfile
    wardrobe = rawWardrobe ?? []
  } catch (error) {
    console.error("Failed to load profile/wardrobe for recommendations:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }

  // Use budget from request (user picked in dashboard) or fall back to profile/default
  const budget = BUDGET_RANGES[budgetParam || profile?.budgetTier || "mid"]
  const bodyRules = profile?.bodyType ? BODY_STYLE_RULES[profile.bodyType] : null
  const goodColors = profile?.skinTone ? SKIN_COLOURS[profile.skinTone] : []
  const wardrobeText = wardrobe.length === 0
    ? "User has no wardrobe items yet."
    : wardrobe.map((i: { id: string; color: string; category: string }) => `- id:${i.id} | ${i.color} ${i.category}`).join("\n")

  const systemPrompt = `You are a premium personal stylist AI.
Generate a complete outfit recommendation for the given event.

User profile:
- Body type: ${profile?.bodyType ?? "unknown"} — ${bodyRules?.note ?? "general styling"}
- Skin tone season: ${profile?.skinTone ?? "unknown"} — good colours: ${goodColors.join(", ") || "any"}
- Budget: ${budget.label} per item
- Style preferences: ${profile?.stylePrefs?.join(", ") || "versatile"}

Rules:
1. ALWAYS suggest from wardrobe first (use item ids)
2. For missing items, suggest specific products to BUY that fit the budget
3. Colours should complement the skin tone
4. Silhouettes should flatter the body type
5. All buy suggestions must be ${budget.label}

Return ONLY valid JSON:
{
  "occasion_vibe": "brief description of the event look",
  "from_wardrobe": [
    { "id": "item-id", "role": "what it is in the outfit", "reason": "why it works (body type/skin tone)" }
  ],
  "buy_suggestions": [
    {
      "name": "specific product name",
      "category": "top/bottom/shoes/accessory/outerwear/dress",
      "color": "specific color",
      "why_body_type": "how this elevates the look for this body type",
      "why_skin_tone": "how this colour complements the skin tone",
      "estimated_price": "$XX",
      "search_query": "google shopping search terms",
      "priority": "highly recommended/recommended/optional touch"
    }
  ],
  "complete_look_tip": "one expert styling tip for the whole look",
  "color_palette": ["color1", "color2", "color3"]
}`

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 800,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: `Event: ${event || "everyday casual"}\n\nMy wardrobe:\n${wardrobeText}` },
      ],
    })

    const text = response.choices[0]?.message?.content ?? "{}"
    const match = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(match?.[0] ?? "{}")

    // Attach wardrobe images
    type WardrobeItem = { id: string; category: string; color: string; imageUrl: string }
    const outfitWithImages = (result.from_wardrobe ?? []).map((pick: { id: string }) => ({
      ...pick,
      item: wardrobe.find((w: WardrobeItem) => w.id === pick.id),
    })).filter((p: { item: WardrobeItem | undefined }) => p.item)

    // Add Google Shopping links
    const buyWithLinks = (result.buy_suggestions ?? []).map((item: { search_query: string; color: string; name: string }) => ({
      ...item,
      shop_url: `https://www.google.com/search?q=${encodeURIComponent(item.search_query + " " + item.color)}&tbm=shop&price_max=${budget.max}`,
    }))

    return NextResponse.json({
      ...result,
      from_wardrobe: outfitWithImages,
      buy_suggestions: buyWithLinks,
      profile: { bodyType: profile?.bodyType, skinTone: profile?.skinTone, budget: budget.label },
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
