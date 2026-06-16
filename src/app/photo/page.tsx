"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"

type WardrobePick = {
  id: string
  reason: string
  item: { imageUrl: string; category: string; color: string }
}

type BuySuggestion = {
  item: string
  reason: string
  budget: string
}

type Result = {
  description: string
  style: string
  from_wardrobe: WardrobePick[]
  buy_suggestions: BuySuggestion[]
  tip: string
  error?: string
}

export default function PhotoPage() {
  const { status } = useSession()
  const [mode, setMode] = useState<"analyze" | "complete">("analyze")
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setProgress(0)
    setResult(null)
    setError(null)

    try {
      const sigRes = await fetch("/api/upload-signature")
      const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json()

      const formData = new FormData()
      formData.append("file", file)
      formData.append("signature", signature)
      formData.append("timestamp", String(timestamp))
      formData.append("api_key", apiKey)
      formData.append("folder", folder)

      const imageUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100))
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
      setUploading(false)

      // Auto-analyse after upload
      await analyse(imageUrl)

    } catch (err) {
      setError(String(err))
      setUploading(false)
    }
  }

  async function analyse(url: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url, mode }),
      })
      const text = await res.text()
      if (!text) { setError("Empty response from server"); return }
      const data = JSON.parse(text)
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Sign in to use Photo Recommendation.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Photo Stylist</h1>
        <p className="text-zinc-500">Upload any photo — AI styles you based on what you own.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-8 p-1 bg-zinc-100 rounded-full w-fit">
        <button
          onClick={() => { setMode("analyze"); setResult(null) }}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${mode === "analyze" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
        >
          🔍 Analyze Style
        </button>
        <button
          onClick={() => { setMode("complete"); setResult(null) }}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${mode === "complete" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
        >
          👗 Complete Outfit
        </button>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-zinc-200 rounded-3xl p-8 text-center cursor-pointer hover:border-zinc-400 transition-colors mb-8"
      >
        {preview ? (
          <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden">
            <Image src={preview} alt="Upload preview" fill className="object-cover" />
          </div>
        ) : (
          <div className="py-6">
            <div className="text-5xl mb-3">📷</div>
            <p className="font-semibold text-zinc-700 mb-1">
              {mode === "analyze" ? "Upload a style photo" : "Upload a clothing item"}
            </p>
            <p className="text-sm text-zinc-400">
              {mode === "analyze" ? "Instagram, Pinterest, celebrity looks" : "A shirt, dress, jacket — anything you own"}
            </p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="mb-6">
          <div className="w-full bg-zinc-100 rounded-full h-2 mb-2">
            <div className="bg-zinc-900 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-zinc-500 text-center">Uploading... {progress}%</p>
        </div>
      )}

      {/* Re-analyse button */}
      {uploadedUrl && !loading && !uploading && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => analyse(uploadedUrl)}
            className="px-6 py-2 border border-zinc-200 text-zinc-600 text-sm rounded-full hover:bg-zinc-50"
          >
            Re-analyse
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-10 h-10 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Analysing your style...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">

          {/* Style summary */}
          <div className="bg-zinc-900 text-white rounded-2xl px-6 py-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Style detected</p>
            <p className="text-xl font-bold mb-1">{result.style}</p>
            <p className="text-zinc-300 text-sm">{result.description}</p>
          </div>

          {/* Tip */}
          {result.tip && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl px-5 py-4">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Stylist tip</p>
              <p className="text-zinc-800 text-sm">{result.tip}</p>
            </div>
          )}

          {/* From wardrobe */}
          {result.from_wardrobe?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">
                From your wardrobe
                <span className="ml-2 text-sm font-normal text-green-600">✓ you own these</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {result.from_wardrobe.map((pick, i) => (
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

          {/* Buy suggestions */}
          {result.buy_suggestions?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-3">What to buy</h2>
              <div className="space-y-3">
                {result.buy_suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-4 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 flex items-center justify-center text-xl flex-shrink-0">🛍</div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 capitalize">{s.item}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{s.reason}</p>
                      <p className="text-xs text-purple-600 font-medium mt-1">{s.budget}</p>
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
