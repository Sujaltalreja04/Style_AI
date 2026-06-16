"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

type InsightsData = {
  total: number
  topColors: { color: string; count: number; pct: number }[]
  categories: { category: string; count: number }[]
  topPattern: string
  seasonCount: Record<string, number>
  missing: string[]
  styleDna: string
  dominantColor: string
  empty?: boolean
}

const COLOR_MAP: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", navy: "#1e3a5f", red: "#dc2626",
  blue: "#2563eb", green: "#16a34a", brown: "#92400e", grey: "#6b7280",
  gray: "#6b7280", pink: "#ec4899", yellow: "#eab308", orange: "#ea580c",
  purple: "#9333ea", beige: "#d4b896", cream: "#fef3c7",
}

const CAT_EMOJI: Record<string, string> = {
  top: "👕", bottom: "👖", dress: "👗", shoes: "👟", outerwear: "🧥", accessory: "👜",
}

export default function InsightsPage() {
  const { status } = useSession()
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/insights")
        .then(async r => {
          if (!r.ok) {
            const d = await r.json().catch(() => null)
            setLoadError(d?.error || "Couldn't load your insights. Please try again.")
            return null
          }
          return r.json()
        })
        .then(d => { if (d) setData(d); setLoading(false) })
        .catch(() => { setLoadError("Couldn't load your insights. Please try again."); setLoading(false) })
    }
  }, [status])

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Sign in to see your style insights.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <p className="text-red-700 text-sm">{loadError}</p>
        </div>
      </div>
    )
  }

  if (data?.empty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">No insights yet</h2>
        <p className="text-zinc-500 mb-6">Upload at least 3 items to your wearboard to see your style DNA.</p>
        <a href="/wearboard" className="px-6 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 transition-colors">
          Go to Wearboard
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Your Style Insights</h1>
        <p className="text-zinc-500">Based on {data?.total} items in your wardrobe.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Style DNA */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-zinc-900 text-white rounded-3xl p-7">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Your Style DNA</p>
          <h2 className="text-4xl font-bold mb-2">{data?.styleDna}</h2>
          <p className="text-zinc-400 text-sm">
            Your wardrobe is dominated by <span className="text-white font-medium capitalize">{data?.dominantColor}</span> tones
            with mostly <span className="text-white font-medium">{data?.topPattern}</span> patterns.
          </p>
        </div>

        {/* Colour breakdown */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Top Colours</p>
          <div className="space-y-3">
            {data?.topColors.map(({ color, count, pct }) => (
              <div key={color}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-zinc-200"
                      style={{ background: COLOR_MAP[color.toLowerCase()] ?? "#d4d4d4" }}
                    />
                    <span className="text-sm font-medium text-zinc-700 capitalize">{color}</span>
                  </div>
                  <span className="text-xs text-zinc-400">{count} items</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-zinc-900 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Wardrobe Mix</p>
          <div className="space-y-3">
            {data?.categories.map(({ category, count }) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CAT_EMOJI[category] ?? "👔"}</span>
                  <span className="text-sm font-medium text-zinc-700 capitalize">{category}</span>
                </div>
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-full">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Missing categories */}
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-4">Wardrobe Gaps</p>
          {data?.missing.length === 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <p className="text-sm text-zinc-700 font-medium">You have every category covered!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-zinc-600 mb-3">You're missing these categories:</p>
              {data?.missing.map(cat => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-lg">{CAT_EMOJI[cat] ?? "👔"}</span>
                  <span className="text-sm font-medium text-zinc-700 capitalize">{cat}</span>
                </div>
              ))}
              <a href="/wearboard" className="inline-block mt-3 text-xs text-amber-700 font-semibold">
                Add missing items →
              </a>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 col-span-1 sm:col-span-2 lg:col-span-3">
          {[
            { label: "Total items", value: data?.total, emoji: "👗" },
            { label: "Colour palette", value: data?.topColors.length + " colours", emoji: "🎨" },
            { label: "Top pattern", value: data?.topPattern, emoji: "✨" },
            { label: "Categories", value: data?.categories.length + " types", emoji: "📦" },
          ].map(stat => (
            <div key={stat.label} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5">
              <div className="text-2xl mb-2">{stat.emoji}</div>
              <div className="text-2xl font-bold text-zinc-900 capitalize">{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
