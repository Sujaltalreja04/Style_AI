import { auth } from "@/auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import Groq from "groq-sdk"
import { NextRequest, NextResponse } from "next/server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 })

  const { imageUrl, mode } = await req.json()
  if (!imageUrl) return NextResponse.json({ error: "No image" }, { status: 400 })

  let wardrobe: any[] = []
  try {
    wardrobe = await convex.query(api.clothing.get, { userId: session.user.id }) || []
  } catch (error) {
    console.error("Failed to load wardrobe for photo:", error)
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }


  const wardrobeText = wardrobe.length === 0
    ? "User has no wardrobe items yet."
    : wardrobe.map(i => `- id:${i.id} | ${i.color} ${i.category}`).join("\n")

  const systemPrompt = mode === "complete"
    ? `You are a fashion stylist. The user uploaded a clothing item.
Suggest what goes with it using their wardrobe.
Return ONLY valid JSON:
{
  "description": "what the uploaded item is",
  "style": "the overall vibe (e.g. smart casual, streetwear)",
  "from_wardrobe": [{ "id": "item-id", "reason": "why it works" }],
  "buy_suggestions": [{ "item": "what to buy", "reason": "why", "budget": "under $X" }],
  "tip": "one styling tip"
}`
    : `You are a fashion stylist. Analyze the style/vibe of this photo.
Match it to the user's wardrobe and suggest what to buy to recreate this look.
Return ONLY valid JSON:
{
  "description": "describe the style in this photo",
  "style": "the style category (e.g. minimalist, boho, streetwear)",
  "from_wardrobe": [{ "id": "item-id", "reason": "why this matches the vibe" }],
  "buy_suggestions": [{ "item": "what to buy", "reason": "why", "budget": "under $X" }],
  "tip": "one tip to nail this style"
}`

  try {
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      max_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: `My wardrobe:\n${wardrobeText}` },
          ] as never,
        },
      ],
    })

    const text = response.choices[0]?.message?.content ?? "{}"
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(jsonMatch?.[0] ?? "{}")

    const outfitWithImages = (result.from_wardrobe ?? []).map((pick: { id: string; reason: string }) => {
      const item = wardrobe.find(w => w.id === pick.id)
      return { ...pick, item }
    }).filter((p: { item: unknown }) => p.item)

    return NextResponse.json({ ...result, from_wardrobe: outfitWithImages })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
