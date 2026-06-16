"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const BODY_TYPES = [
  { value: "pear",              label: "Pear",              emoji: "🍐", desc: "Hips wider than shoulders" },
  { value: "apple",             label: "Apple",             emoji: "🍎", desc: "Fuller midsection" },
  { value: "hourglass",         label: "Hourglass",         emoji: "⌛", desc: "Balanced shoulders & hips" },
  { value: "rectangle",         label: "Rectangle",         emoji: "▬",  desc: "Similar width throughout" },
  { value: "inverted_triangle", label: "Inverted Triangle", emoji: "🔺", desc: "Shoulders wider than hips" },
]

const SKIN_TONES = [
  { value: "spring", label: "Spring", color: "#F4C2A1", desc: "Warm & light — peach, coral, warm beige" },
  { value: "summer", label: "Summer", color: "#D4A5A5", desc: "Cool & light — rose, lavender, soft pink" },
  { value: "autumn", label: "Autumn", color: "#C17E3B", desc: "Warm & deep — rust, olive, caramel" },
  { value: "winter", label: "Winter", color: "#6B4E71", desc: "Cool & deep — navy, jewel tones, black" },
]

const EVENTS = [
  { value: "work",    label: "Work & Office",     emoji: "💼" },
  { value: "casual",  label: "Casual & Everyday", emoji: "☀️" },
  { value: "date",    label: "Date Nights",        emoji: "💕" },
  { value: "wedding", label: "Weddings & Events",  emoji: "💍" },
  { value: "party",   label: "Parties & Clubs",    emoji: "🎉" },
  { value: "gym",     label: "Gym & Sports",       emoji: "🏃" },
  { value: "travel",  label: "Travel",             emoji: "✈️" },
  { value: "formal",  label: "Formal & Black tie", emoji: "🎩" },
]

const STYLES = [
  { value: "minimalist", label: "Minimalist", emoji: "⚪" },
  { value: "streetwear", label: "Streetwear",  emoji: "🧢" },
  { value: "classic",    label: "Classic",     emoji: "👔" },
  { value: "bohemian",   label: "Bohemian",    emoji: "🌸" },
  { value: "sporty",     label: "Sporty",      emoji: "🏅" },
  { value: "edgy",       label: "Edgy",        emoji: "⚡" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [bodyType, setBodyType] = useState("")
  const [skinTone, setSkinTone] = useState("")
  const [events, setEvents] = useState<string[]>([])
  const [stylePrefs, setStylePrefs] = useState<string[]>([])

  function toggleEvent(v: string) {
    setEvents(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])
  }
  function toggleStyle(v: string) {
    setStylePrefs(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])
  }

  async function finish() {
    setSaving(true)
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bodyType, skinTone, events, stylePrefs }),
    })
    router.push("/dashboard")
  }

  const progress = (step / 4) * 100

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-100">
        <div className="h-1 bg-zinc-900 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">

          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Step {step} of 4</p>

          {/* ── STEP 1: Body Type ── */}
          {step === 1 && (
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 mb-2">What's your body type?</h1>
              <p className="text-zinc-500 mb-8">We'll suggest silhouettes and cuts that flatter your shape.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {BODY_TYPES.map(b => (
                  <button key={b.value} onClick={() => setBodyType(b.value)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${bodyType === b.value ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 hover:border-zinc-300"}`}
                  >
                    <div className="text-3xl mb-2">{b.emoji}</div>
                    <div className="font-semibold text-zinc-900">{b.label}</div>
                    <div className="text-xs text-zinc-500 mt-1">{b.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => { setBodyType(""); setStep(2) }} className="text-sm text-zinc-400 hover:text-zinc-600">Skip</button>
                <button onClick={() => setStep(2)} disabled={!bodyType}
                  className="px-8 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 disabled:opacity-30 transition-all"
                >Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Skin Tone ── */}
          {step === 2 && (
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 mb-2">What's your skin tone season?</h1>
              <p className="text-zinc-500 mb-8">We'll recommend colours that complement your natural tone.</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {SKIN_TONES.map(s => (
                  <button key={s.value} onClick={() => setSkinTone(s.value)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${skinTone === s.value ? "border-zinc-900" : "border-zinc-100 hover:border-zinc-300"}`}
                  >
                    <div className="w-12 h-12 rounded-full mb-3 border border-zinc-200" style={{ background: s.color }} />
                    <div className="font-semibold text-zinc-900">{s.label}</div>
                    <div className="text-xs text-zinc-500 mt-1">{s.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-zinc-400 hover:text-zinc-600">← Back</button>
                <div className="flex gap-3">
                  <button onClick={() => { setSkinTone(""); setStep(3) }} className="text-sm text-zinc-400 hover:text-zinc-600">Skip</button>
                  <button onClick={() => setStep(3)} disabled={!skinTone}
                    className="px-8 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 disabled:opacity-30 transition-all"
                  >Continue →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Events ── */}
          {step === 3 && (
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 mb-2">What do you dress for?</h1>
              <p className="text-zinc-500 mb-8">Pick all that apply. We'll focus on these occasions.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {EVENTS.map(e => (
                  <button key={e.value} onClick={() => toggleEvent(e.value)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${events.includes(e.value) ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 hover:border-zinc-300"}`}
                  >
                    <div className="text-2xl mb-1">{e.emoji}</div>
                    <div className="text-xs font-medium text-zinc-700">{e.label}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-zinc-400 hover:text-zinc-600">← Back</button>
                <button onClick={() => setStep(4)} disabled={events.length === 0}
                  className="px-8 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 disabled:opacity-30 transition-all"
                >Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Style ── */}
          {step === 4 && (
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 mb-2">What's your style vibe?</h1>
              <p className="text-zinc-500 mb-8">Pick your aesthetic. Mix as many as you like.</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {STYLES.map(s => (
                  <button key={s.value} onClick={() => toggleStyle(s.value)}
                    className={`p-5 rounded-2xl border-2 text-center transition-all ${stylePrefs.includes(s.value) ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 hover:border-zinc-300"}`}
                  >
                    <div className="text-3xl mb-2">{s.emoji}</div>
                    <div className="text-sm font-medium text-zinc-700">{s.label}</div>
                  </button>
                ))}
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5 mb-8 space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Your profile summary</p>
                {bodyType && <p className="text-sm text-zinc-700">Body type: <span className="font-semibold capitalize">{bodyType.replace("_", " ")}</span></p>}
                {skinTone && <p className="text-sm text-zinc-700">Skin tone: <span className="font-semibold capitalize">{skinTone} season</span></p>}
                {events.length > 0 && <p className="text-sm text-zinc-700">Occasions: <span className="font-semibold">{events.length} selected</span></p>}
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="text-sm text-zinc-400 hover:text-zinc-600">← Back</button>
                <button onClick={finish} disabled={saving}
                  className="px-8 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 disabled:opacity-50 transition-all"
                >
                  {saving ? "Setting up..." : "Start styling me ✨"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
