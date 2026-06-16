"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

type Profile = {
  bodyType: string | null
  skinTone: string | null
  budgetTier: string | null
  events: string[]
  stylePrefs: string[]
}

type WardrobeItem = { id: string; imageUrl: string; category: string; color: string }

type RecommendedItem = {
  name: string
  category: string
  color: string
  why_body_type: string
  why_skin_tone: string
  estimated_price: string
  shop_url: string
  priority: string
}

type OutfitPick = {
  id: string
  role: string
  reason: string
  item: WardrobeItem
}

type Recommendation = {
  occasion_vibe: string
  from_wardrobe: OutfitPick[]
  buy_suggestions: RecommendedItem[]
  complete_look_tip: string
  color_palette: string[]
  profile: { bodyType: string; skinTone: string; budget: string }
}

const QUICK_EVENTS = ["Work meeting", "Casual day out", "Date night", "Wedding guest", "Party", "Gym"]

const SKIN_SEASON_COLORS: Record<string, string> = {
  spring: "#F4C2A1", summer: "#D4A5A5", autumn: "#C17E3B", winter: "#6B4E71",
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([])
  const [selectedEvent, setSelectedEvent] = useState("Casual day out")
  const [budget, setBudget] = useState("")
  const [rec, setRec] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
    if (status === "authenticated" && !loaded) {
      setLoaded(true)
      Promise.all([
        fetch("/api/profile").then(r => r.ok ? r.json() : null),
        fetch("/api/clothes").then(r => r.ok ? r.json() : []),
      ]).then(([p, w]) => {
        if (!p?.bodyType) router.push("/onboarding")
        setProfile(p || {})
        setWardrobe(Array.isArray(w) ? w : [])
      })
    }
  }, [status, loaded, router])

  async function getRecommendation(event: string, budgetOverride?: string) {
    setSelectedEvent(event)
    setLoading(true)
    setError(null)
    setRec(null)
    const activeBudget = budgetOverride || budget || "mid"
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, budget: activeBudget }),
      })
      const text = await res.text()
      const data = JSON.parse(text)
      if (data.error) { setError(data.error); return }
      setRec(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Hey, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-zinc-500 mt-1">Your personal AI stylist is ready.</p>
        </div>
        <Link href="/onboarding" className="text-xs text-zinc-400 hover:text-zinc-600 border border-zinc-200 px-3 py-2 rounded-full">
          Edit profile
        </Link>
      </div>

      {/* Profile strip */}
      <div className="flex flex-wrap gap-3 mb-8">
        {profile.bodyType && (
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-full">
            <span className="text-sm">👤</span>
            <span className="text-sm font-medium text-zinc-700 capitalize">{profile.bodyType.replace("_", " ")}</span>
          </div>
        )}
        {profile.skinTone && (
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-full">
            <div className="w-4 h-4 rounded-full border border-zinc-300" style={{ background: SKIN_SEASON_COLORS[profile.skinTone] }} />
            <span className="text-sm font-medium text-zinc-700 capitalize">{profile.skinTone} season</span>
          </div>
        )}
        {profile.budgetTier && (
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-full">
            <span className="text-sm">💰</span>
            <span className="text-sm font-medium text-zinc-700 capitalize">{profile.budgetTier} budget</span>
          </div>
        )}
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-full">
          <span className="text-sm">👗</span>
          <span className="text-sm font-medium text-zinc-700">{wardrobe.length} items</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — Outfit generator */}
        <div className="lg:col-span-2 space-y-5">

          {/* Event selector */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">What are you dressing for?</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_EVENTS.map(e => (
                <button key={e} onClick={() => getRecommendation(e)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedEvent === e && rec ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >{e}</button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder='Or type anything: "Beach wedding in July"'
                className="flex-1 px-4 py-3 border border-zinc-200 rounded-full text-sm focus:outline-none focus:border-zinc-400"
                onKeyDown={(e) => { if (e.key === "Enter") getRecommendation((e.target as HTMLInputElement).value) }}
              />
              <button
                onClick={(e) => { const input = (e.currentTarget.previousSibling as HTMLInputElement); if (input.value) getRecommendation(input.value) }}
                className="px-5 py-3 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-700"
              >Style me</button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white border border-zinc-100 rounded-3xl p-10 shadow-sm flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm">Building your personalised outfit...</p>
              {profile.bodyType && <p className="text-xs text-zinc-400">Optimising for {profile.bodyType.replace("_", " ")} body type</p>}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {rec && !loading && (
            <div className="space-y-5">

              {/* Vibe + tip */}
              <div className="bg-zinc-900 text-white rounded-3xl p-6">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">The look</p>
                <p className="text-xl font-bold mb-3">{rec.occasion_vibe}</p>
                {rec.color_palette?.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs text-zinc-400">Colour palette:</p>
                    {rec.color_palette.map((c, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white capitalize">{c}</span>
                    ))}
                  </div>
                )}
                <div className="bg-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-200">
                  💡 {rec.complete_look_tip}
                </div>
              </div>

              {/* From wardrobe */}
              {rec.from_wardrobe?.length > 0 && (
                <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-zinc-900">From your wardrobe</h3>
                    <span className="text-xs text-green-600 font-semibold">✓ You own these</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {rec.from_wardrobe.map((pick, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden border border-zinc-100">
                        <div className="relative aspect-square bg-zinc-50">
                          <Image src={pick.item.imageUrl} alt={pick.role} fill className="object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-semibold text-zinc-900 capitalize">{pick.role}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{pick.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget picker — shown when there are items to buy */}
              {rec.from_wardrobe !== undefined && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
                  <p className="text-sm font-semibold text-zinc-800 mb-3">Want AI to suggest items to elevate this outfit? Pick your budget:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "student",  label: "Under $25",   emoji: "🎓" },
                      { value: "budget",   label: "$25–$60",     emoji: "💰" },
                      { value: "mid",      label: "$60–$180",    emoji: "👜" },
                      { value: "premium",  label: "$180–$600",   emoji: "💎" },
                      { value: "luxury",   label: "$600+",       emoji: "👑" },
                    ].map(b => (
                      <button key={b.value}
                        onClick={() => { setBudget(b.value); getRecommendation(selectedEvent, b.value) }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                          budget === b.value ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400"
                        }`}
                      >
                        <span>{b.emoji}</span> {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Buy suggestions */}
              {rec.buy_suggestions?.length > 0 && (
                <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-bold text-zinc-900 mb-1">Recommended for this outfit</h3>
                  <p className="text-xs text-zinc-400 mb-4">Curated suggestions within your budget — tailored to your body type and skin tone</p>
                  <div className="space-y-3">
                    {rec.buy_suggestions.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          item.priority === "essential" ? "bg-red-400" :
                          item.priority === "recommended" ? "bg-yellow-400" : "bg-green-400"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-zinc-900 text-sm capitalize">{item.name}</p>
                            <span className="text-sm font-bold text-zinc-900 flex-shrink-0">{item.estimated_price}</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">{item.why_body_type}</p>
                          <p className="text-xs text-purple-600 mt-0.5">{item.why_skin_tone}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              item.priority === "essential" ? "bg-red-50 text-red-600" :
                              item.priority === "recommended" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"
                            }`}>{item.priority}</span>
                          </div>
                        </div>
                        <a href={item.shop_url} target="_blank" rel="noopener noreferrer"
                          className="flex-shrink-0 px-3 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
                        >Shop →</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* RIGHT — Quick access */}
        <div className="space-y-4">

          {/* Wardrobe preview */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-zinc-900">My Wardrobe</h3>
              <Link href="/wearboard" className="text-xs text-zinc-400 hover:text-zinc-600">View all →</Link>
            </div>
            {wardrobe.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-zinc-400 mb-3">No items yet</p>
                <Link href="/wearboard" className="text-sm text-zinc-900 font-semibold border border-zinc-200 px-4 py-2 rounded-full hover:bg-zinc-50">
                  + Add clothes
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {wardrobe.slice(0, 6).map(item => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-50">
                    <Image src={item.imageUrl} alt={item.category} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-4">Quick access</h3>
            <div className="space-y-2">
              {[
                { href: "/events",   emoji: "📅", label: "Event Stylist",    desc: "Plan any occasion" },
                { href: "/photo",    emoji: "📷", label: "Photo Stylist",    desc: "Analyse any look" },
                { href: "/shop",     emoji: "🛍", label: "Shop",             desc: "Fill wardrobe gaps" },
                { href: "/insights", emoji: "📊", label: "Style Insights",   desc: "Know your style DNA" },
                { href: "/feed",     emoji: "👥", label: "Community Feed",   desc: "See others' looks" },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group"
                >
                  <span className="text-xl">{link.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{link.label}</p>
                    <p className="text-xs text-zinc-400">{link.desc}</p>
                  </div>
                  <span className="ml-auto text-zinc-300 group-hover:text-zinc-500">→</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
