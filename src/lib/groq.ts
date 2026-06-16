import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy-key-for-build" })

type WardrobeItem = {
  id: string
  category: string
  color: string
  imageUrl: string
}

export async function suggestOutfit(event: string, wardrobe: WardrobeItem[]) {
  const wardrobeText = wardrobe.length === 0
    ? "The user has no clothes uploaded yet."
    : wardrobe.map(i => `- ${i.color} ${i.category} (id: ${i.id})`).join("\n")

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: `You are a personal fashion stylist. Given a user's event and their wardrobe, suggest the best outfit.
Return ONLY a valid JSON object like this:
{
  "outfit": [
    { "id": "item-id-from-wardrobe", "reason": "why this piece works" }
  ],
  "missing": [
    { "item": "what to buy", "reason": "why it's needed", "budget": "under $50" }
  ],
  "tip": "one styling tip for this event"
}
Only use items from the wardrobe list provided. If wardrobe is empty, outfit array should be empty.`,
      },
      {
        role: "user",
        content: `Event: ${event}\n\nMy wardrobe:\n${wardrobeText}`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content ?? "{}"

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch?.[0] ?? "{}")
  } catch {
    return { outfit: [], missing: [], tip: "Could not generate suggestion. Try again." }
  }
}
