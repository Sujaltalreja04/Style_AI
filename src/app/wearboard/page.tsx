"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"

type ClothingItem = {
  id: string
  imageUrl: string
  category: string
  color: string
  createdAt: string
}

const CATEGORIES = [
  { value: "top",       emoji: "👕", label: "Top" },
  { value: "bottom",    emoji: "👖", label: "Bottom" },
  { value: "dress",     emoji: "👗", label: "Dress" },
  { value: "shoes",     emoji: "👟", label: "Shoes" },
  { value: "outerwear", emoji: "🧥", label: "Outerwear" },
  { value: "accessory", emoji: "👜", label: "Accessory" },
]

const COLORS = ["Black","White","Navy","Red","Blue","Green","Brown","Grey","Pink","Yellow","Orange","Purple","Beige"]

export default function WearboardPage() {
  const { status } = useSession()
  const [clothes, setClothes] = useState<ClothingItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState("all")
  const [step, setStep] = useState<"idle" | "uploading" | "tagging">("idle")
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [category, setCategory] = useState("top")
  const [color, setColor] = useState("Black")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (status === "authenticated" && !loaded) {
    setLoaded(true)
    fetch("/api/clothes")
      .then(r => r.ok ? r.json() : [])
      .then(data => setClothes(Array.isArray(data) ? data : []))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setStep("uploading")
    setUploadProgress(0)

    try {
      // Step 1: Get upload signature from our server (fast — no file transfer)
      const sigRes = await fetch("/api/upload-signature")
      const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json()

      // Step 2: Upload DIRECTLY from browser to Cloudinary (fast!)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("signature", signature)
      formData.append("timestamp", String(timestamp))
      formData.append("api_key", apiKey)
      formData.append("folder", folder)

      // Use XMLHttpRequest to track upload progress
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round(e.loaded / e.total * 100))
        }
        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText)
          if (data.secure_url) resolve(data.secure_url)
          else reject(new Error("Upload failed"))
        }
        xhr.onerror = () => reject(new Error("Network error"))
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
        xhr.send(formData)
      })

      setUploadedUrl(imageUrl)
      setStep("tagging")

    } catch (err) {
      console.error(err)
      setStep("idle")
      setPreview(null)
    }
  }

  async function handleSave() {
    if (!uploadedUrl) return
    setSaveError(null)

    try {
      const res = await fetch("/api/clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadedUrl, category, color: color.toLowerCase() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setSaveError(data?.error || "Couldn't save this item. Please try again.")
        return
      }

      const newItem = await res.json()
      setClothes(prev => [newItem, ...prev])
      setStep("idle")
      setPreview(null)
      setUploadedUrl(null)
      setUploadProgress(0)
    } catch {
      setSaveError("Network error. Please try again.")
    }
  }

  const filtered = filter === "all" ? clothes : clothes.filter(c => c.category === filter)

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Sign in to view your wearboard.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Your Wearboard</h1>
          <p className="text-zinc-500 mt-1">{clothes.length} items</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 transition-colors"
        >
          <span className="text-xl">+</span> Add clothing
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {["all", ...CATEGORIES.map(c => c.value)].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === cat ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >{cat}</button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && step === "idle" && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">👗</div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">
            {filter === "all" ? "Your wardrobe is empty" : `No ${filter}s yet`}
          </h2>
          <p className="text-zinc-500 mb-6">Upload a photo to get started</p>
          <button onClick={() => fileRef.current?.click()}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-500 transition-colors"
          >Upload first item</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="group relative bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 aspect-square">
            <Image src={item.imageUrl} alt={item.category} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-xs font-medium capitalize">{item.category}</p>
              <p className="text-white/70 text-xs capitalize">{item.color}</p>
            </div>
          </div>
        ))}
      </div>

      {/* UPLOADING modal */}
      {step === "uploading" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-80 text-center">
            {preview && (
              <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden mb-5">
                <Image src={preview} alt="Preview" fill className="object-cover" />
              </div>
            )}
            <div className="w-full bg-zinc-100 rounded-full h-2 mb-3">
              <div
                className="bg-zinc-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm font-medium text-zinc-700">Uploading... {uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* TAGGING modal */}
      {step === "tagging" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            {uploadedUrl && (
              <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-5">
                <Image src={uploadedUrl} alt="Uploaded" fill className="object-cover" />
              </div>
            )}
            <h2 className="text-lg font-bold text-zinc-900 mb-4">What is this?</h2>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setCategory(cat.value)}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                    category === cat.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    color === c ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >{c}</button>
              ))}
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
                <p className="text-red-700 text-sm">{saveError}</p>
              </div>
            )}

            <button onClick={handleSave}
              className="w-full py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 transition-colors"
            >
              Save to wardrobe
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
