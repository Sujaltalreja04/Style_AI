const HF_TOKEN = process.env.HUGGINGFACE_API_KEY
const BLIP_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large"

// Parse BLIP caption into structured clothing tags
function parseCaption(caption: string) {
  const text = caption.toLowerCase()

  // Category detection
  let category = "top"
  if (/pants|jeans|trousers|shorts|skirt|leggings/.test(text)) category = "bottom"
  else if (/dress|gown|jumpsuit|romper/.test(text)) category = "dress"
  else if (/shoe|boot|sneaker|heel|sandal|loafer|trainer/.test(text)) category = "shoes"
  else if (/jacket|coat|hoodie|blazer|cardigan|sweater|sweatshirt/.test(text)) category = "outerwear"
  else if (/bag|hat|cap|scarf|belt|watch|necklace|earring|accessory|purse/.test(text)) category = "accessory"
  else if (/shirt|top|blouse|tshirt|t-shirt|tank|camisole/.test(text)) category = "top"

  // Color detection
  const colors = ["black", "white", "red", "blue", "navy", "green", "yellow", "orange",
    "purple", "pink", "brown", "grey", "gray", "beige", "cream", "gold", "silver"]
  const foundColor = colors.find(c => text.includes(c)) ?? "unknown"

  // Pattern detection
  let pattern = "solid"
  if (/strip/.test(text)) pattern = "striped"
  else if (/floral|flower/.test(text)) pattern = "floral"
  else if (/plaid|tartan|check/.test(text)) pattern = "plaid"
  else if (/graphic|print|pattern/.test(text)) pattern = "graphic"

  // Season detection
  let season = "all"
  if (/wool|coat|knit|winter|thick|heavy/.test(text)) season = "winter"
  else if (/linen|light|summer|thin|short/.test(text)) season = "summer"

  return { category, color: foundColor, pattern, season }
}

export async function tagClothing(imageUrl: string) {
  try {
    // Fetch the image and send as binary to Hugging Face
    const imgRes = await fetch(imageUrl)
    const imgBuffer = await imgRes.arrayBuffer()

    const res = await fetch(BLIP_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      body: imgBuffer,
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      // Model might be loading (cold start) — return fallback
      return { category: "top", color: "unknown", pattern: "solid", season: "all" }
    }

    const data = await res.json()
    const caption: string = Array.isArray(data) ? data[0]?.generated_text ?? "" : ""

    return parseCaption(caption)
  } catch {
    return { category: "top", color: "unknown", pattern: "solid", season: "all" }
  }
}
