import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import SignInButton from "@/components/SignInButton"

export default async function HomePage() {
  const session = await auth()

  // Logged-in users go straight to their dashboard
  if (session?.user) {
    redirect("/dashboard")
  }

  // Non-logged-in users see the landing page
  return (
    <div className="flex flex-col">

      {/* ── HERO ── */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-24 pb-20">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          AI-Powered Personal Styling
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-zinc-900 leading-tight max-w-2xl mb-6">
          Never say{" "}
          <span className="text-purple-600">"I have nothing</span>
          <br />
          <span className="text-purple-600">to wear"</span>{" "}again
        </h1>

        <p className="text-xl text-zinc-500 max-w-xl mb-10 leading-relaxed">
          Your personal AI stylist — outfit suggestions based on your body type,
          skin tone, wardrobe, and budget.
        </p>

        {/* CTA — clicking these triggers Google sign in then goes to dashboard */}
        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <SignInButton className="px-8 py-4 bg-zinc-900 text-white font-semibold rounded-full text-lg hover:bg-zinc-700 transition-colors text-center">
            Get Started Free
          </SignInButton>
          <Link href="#how-it-works"
            className="px-8 py-4 bg-white text-zinc-900 font-semibold rounded-full text-lg border border-zinc-200 hover:bg-zinc-50 transition-colors text-center"
          >
            See How It Works
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 text-sm text-zinc-500">
          <span className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>Works with your existing wardrobe</span>
          <span className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>Any age, body type, budget</span>
          <span className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>Free to start — no credit card</span>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-zinc-50 px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-zinc-900 mb-4">How Style AI works</h2>
          <p className="text-center text-zinc-500 mb-14 text-lg">Set up once. Get personalised outfits forever.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { emoji: "👤", step: "Step 1", color: "bg-purple-100", textColor: "text-purple-600", title: "Build your style profile", desc: "Tell us your body type, skin tone, budget and events you dress for. Takes 3 minutes." },
              { emoji: "👗", step: "Step 2", color: "bg-blue-100",   textColor: "text-blue-600",   title: "Upload your wardrobe",   desc: "Add photos of clothes you own. AI tags them automatically." },
              { emoji: "✨", step: "Step 3", color: "bg-green-100",  textColor: "text-green-600",  title: "Get your outfit",         desc: "Pick any event. AI builds a complete look from your wardrobe + links what to buy within your budget." },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center text-2xl mb-5`}>{s.emoji}</div>
                <div className={`text-xs font-semibold ${s.textColor} uppercase tracking-wide mb-2`}>{s.step}</div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3">{s.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSONALISED FOR YOU ── */}
      <section className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-zinc-900 mb-4">Personalised for YOU</h2>
          <p className="text-center text-zinc-500 mb-14 text-lg">Not generic fashion advice. Recommendations built around your exact profile.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { emoji: "👤", label: "Body Type", desc: "Silhouettes that flatter your shape" },
              { emoji: "🎨", label: "Skin Tone",  desc: "Colours that make you glow" },
              { emoji: "💰", label: "Budget",     desc: "Shops within your price range" },
              { emoji: "📅", label: "Event",      desc: "Right outfit for any occasion" },
            ].map(f => (
              <div key={f.label} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 text-center">
                <div className="text-3xl mb-3">{f.emoji}</div>
                <div className="font-semibold text-zinc-900 mb-1">{f.label}</div>
                <div className="text-xs text-zinc-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR EVERYONE ── */}
      <section className="bg-zinc-50 px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-zinc-900 mb-14">Built for everyone</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { emoji: "🎓", label: "Students",        desc: '"Just tell me what matches"' },
              { emoji: "💼", label: "Professionals",   desc: '"3 options for my meeting"' },
              { emoji: "🛍", label: "Thrift shoppers", desc: '"What goes with this jacket?"' },
              { emoji: "💍", label: "Wedding guests",  desc: '"What\'s semi-formal in July?"' },
              { emoji: "🌸", label: "Plus size",       desc: '"Show cuts that flatter me"' },
              { emoji: "👨", label: "Men",             desc: '"I have no idea about fashion"' },
            ].map(p => (
              <div key={p.label} className="bg-white rounded-2xl p-6 border border-zinc-100">
                <div className="text-3xl mb-3">{p.emoji}</div>
                <div className="font-semibold text-zinc-900 mb-1">{p.label}</div>
                <div className="text-sm text-zinc-500 italic">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-zinc-900 px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Ready to never stress about outfits again?</h2>
        <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">Sign in with Google in one click. Your AI stylist is ready in 3 minutes.</p>
        <SignInButton className="inline-block px-10 py-4 bg-purple-600 text-white font-semibold rounded-full text-lg hover:bg-purple-500 transition-colors">
          Start for Free — Sign in with Google
        </SignInButton>
      </section>

    </div>
  )
}
