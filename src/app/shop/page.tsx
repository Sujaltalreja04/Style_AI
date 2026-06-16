"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

type ShopItem = {
  name: string
  category: string
  reason: string
  estimatedPrice: string
  shopUrl: string
}

const BUDGETS = [
  { value: "budget", label: "Budget", desc: "Under $30" },
  { value: "mid",    label: "Mid",    desc: "$30–$100" },
  { value: "premium",label: "Premium",desc: "Over $100" },
]

const REASONS = [
  { value: "wardrobe gaps",    label: "Fill my gaps",    emoji: "🎯" },
  { value: "work outfits",     label: "Work outfits",    emoji: "💼" },
  { value: "casual everyday",  label: "Casual wear",     emoji: "☀️" },
  { value: "special occasions",label: "Special occasions",emoji: "✨" },
  { value: "basics capsule",   label: "Build basics",    emoji: "📦" },
]

const CAT_EMOJI: Record<string, string> = {
  top: "👕", bottom: "👖", dress: "👗", shoes: "👟",
  outerwear: "🧥", accessory: "👜", unknown: "🛍",
}

export default function ShopPage() {
  const { status } = useSession()
  const [budget, setBudget] = useState("mid")
  const [reason, setReason] = useState("wardrobe gaps")
  const [items, setItems] = useState<ShopItem[]>([])
  const [missing, setMissing] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated" && !loaded) {
      setLoaded(true)
      fetchRecommendations("mid", "wardrobe gaps")
    }
  }, [status, loaded])

  async function fetchRecommendations(b: string, r: string) {
    setLoading(true)
    setItems([])
    setError(null)
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: b, reason: r }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        setError(data?.error || "Couldn't load recommendations. Please try again.")
        return
      }
      setItems(data.items ?? [])
      setMissing(data.missingCategories ?? [])
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleFilter(b: string, r: string) {
    setBudget(b)
    setReason(r)
    fetchRecommendations(b, r)
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Sign in to see your shopping recommendations.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Shop</h1>
        <p className="text-zinc-500">AI picks what your wardrobe needs most — linked to real stores.</p>
      </div>

      {/* Wardrobe gaps banner */}
      {missing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-semibold text-amber-800">Your wardrobe is missing:</span>
          {missing.map(cat => (
            <span key={cat} className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full capitalize">
              {CAT_EMOJI[cat]} {cat}
            </span>
          ))}
        </div>
      )}

      {/* Budget filter */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Budget</p>
        <div className="flex gap-2">
          {BUDGETS.map(b => (
            <button key={b.value} onClick={() => handleFilter(b.value, reason)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                budget === b.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {b.label} <span className="text-xs opacity-70">{b.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reason filter */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Shopping for</p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map(r => (
            <button key={r.value} onClick={() => handleFilter(budget, r.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                reason === r.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {r.emoji} {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-10 h-10 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Finding the best items for you...</p>
        </div>
      )}

      {/* Items grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-zinc-100 rounded-xl flex items-center justify-center text-2xl">
                  {CAT_EMOJI[item.category] ?? "🛍"}
                </div>
                <span className="text-sm font-bold text-zinc-900">{item.estimatedPrice}</span>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1 leading-tight">{item.name}</h3>
              <p className="text-xs text-zinc-500 mb-4">{item.reason}</p>
              <a
                href={item.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Shop on Google 🛍
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Refresh */}
      {!loading && (items.length > 0 || error) && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => fetchRecommendations(budget, reason)}
            className="px-6 py-3 border border-zinc-200 text-zinc-600 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
          >
            Refresh suggestions
          </button>
        </div>
      )}

    </div>
  )
}
