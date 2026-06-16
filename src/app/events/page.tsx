"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"

const QUICK_EVENTS = [
  "Job interview",
  "Beach wedding",
  "Date night",
  "Casual Friday",
  "Birthday party",
  "Gym workout",
]

type OutfitPick = {
  id: string
  reason: string
  item: { imageUrl: string; category: string; color: string }
}

type MissingItem = {
  item: string
  reason: string
  budget: string
}

type Suggestion = {
  outfit: OutfitPick[]
  missing: MissingItem[]
  tip: string
}

export default function EventsPage() {
  const { status } = useSession()
  const [event, setEvent] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Suggestion | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function getSuggestion(eventText: string) {
    if (!eventText.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: eventText }),
      })
      const text = await res.text()
      if (!text) { setError("Server returned empty response. Check your Groq API key."); return }
      const data = JSON.parse(text)
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch (e) {
      setError("Something went wrong: " + String(e))
    } finally {
      setLoading(false)
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Sign in to use the Event Stylist.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Event Stylist</h1>
        <p className="text-zinc-500">Tell me where you're going — I'll build your outfit from your wardrobe.</p>
      </div>

      {/* Input */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={event}
          onChange={e => setEvent(e.target.value)}
          onKeyDown={e => e.key === "Enter" && getSuggestion(event)}
          placeholder='e.g. "beach wedding in July, semi-formal"'
          className="flex-1 px-4 py-3 border border-zinc-200 rounded-full text-sm focus:outline-none focus:border-zinc-400"
        />
        <button
          onClick={() => getSuggestion(event)}
          disabled={loading || !event.trim()}
          className="px-6 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "Thinking..." : "Style me"}
        </button>
      </div>

      {/* Quick picks */}
      <div className="flex gap-2 flex-wrap mb-10">
        {QUICK_EVENTS.map(e => (
          <button
            key={e}
            onClick={() => { setEvent(e); getSuggestion(e) }}
            className="px-4 py-2 bg-zinc-100 text-zinc-600 text-sm rounded-full hover:bg-zinc-200 transition-colors"
          >
            {e}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-4">
          <p className="text-red-700 text-sm font-medium">Error: {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <div className="w-10 h-10 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Checking your wardrobe...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">

          {/* Styling tip */}
          {result.tip && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl px-5 py-4">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Stylist tip</p>
              <p className="text-zinc-800 text-sm">{result.tip}</p>
            </div>
          )}

          {/* Outfit from wardrobe */}
          {result.outfit.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">
                From your wardrobe
                <span className="ml-2 text-sm font-normal text-green-600">✓ you already own these</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {result.outfit.map((pick, i) => (
                  <div key={i} className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
                    <div className="relative aspect-square">
                      <Image src={pick.item.imageUrl} alt={pick.item.category} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-zinc-900 capitalize">{pick.item.color} {pick.item.category}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{pick.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty wardrobe */}
          {result.outfit.length === 0 && (
            <div className="bg-zinc-50 rounded-2xl p-6 text-center border border-zinc-100">
              <p className="text-zinc-500 text-sm">No matching items in your wardrobe yet.</p>
              <a href="/wearboard" className="text-sm text-purple-600 font-medium mt-2 inline-block">
                Add clothes to your wearboard →
              </a>
            </div>
          )}

          {/* Missing items */}
          {result.missing.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">
                What to buy
                <span className="ml-2 text-sm font-normal text-zinc-400">to complete this look</span>
              </h2>
              <div className="space-y-3">
                {result.missing.map((m, i) => (
                  <div key={i} className="flex items-start gap-4 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 flex items-center justify-center text-xl flex-shrink-0">🛍</div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 capitalize">{m.item}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{m.reason}</p>
                      <p className="text-xs text-purple-600 font-medium mt-1">{m.budget}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
