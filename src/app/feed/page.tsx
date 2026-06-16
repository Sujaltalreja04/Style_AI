"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"

type Post = {
  id: string
  userId: string
  userName: string
  userImage: string | null
  caption: string | null
  coverImage: string
  clothingIds: string[]
  likesCount: number
  createdAt: string
}

export default function FeedPage() {
  const { data: session, status } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    fetch("/api/posts")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setPosts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function toggleLike(postId: string) {
    if (status !== "authenticated") return
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" })
      if (!res.ok) return
      const { liked } = await res.json()
      setLikedPosts(prev => {
        const next = new Set(prev)
        liked ? next.add(postId) : next.delete(postId)
        return next
      })
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likesCount: p.likesCount + (liked ? 1 : -1) } : p
      ))
    } catch {
      // ignore — like is non-critical
    }
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">StyleFeed</h1>
          <p className="text-zinc-500 mt-1">See what everyone's wearing</p>
        </div>
        {status === "authenticated" && (
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 transition-colors"
          >
            <span>+</span> Share a look
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">👗</div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">No posts yet</h2>
          <p className="text-zinc-500 mb-6">Be the first to share a look!</p>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">

            {/* User info */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              {post.userImage ? (
                <Image src={post.userImage} alt={post.userName} width={36} height={36} className="rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {post.userName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-zinc-900">{post.userName}</p>
                <p className="text-xs text-zinc-400">{timeAgo(post.createdAt)}</p>
              </div>
              {post.userId === session?.user?.id && (
                <span className="ml-auto px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">You</span>
              )}
            </div>

            {/* Cover image */}
            <div className="relative aspect-square">
              <Image src={post.coverImage} alt="Outfit" fill className="object-cover" />
              <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                {post.clothingIds.length} items
              </div>
            </div>

            {/* Actions + caption */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    likedPosts.has(post.id) ? "text-red-500" : "text-zinc-500 hover:text-red-400"
                  }`}
                >
                  <span className="text-xl">{likedPosts.has(post.id) ? "❤️" : "🤍"}</span>
                  {post.likesCount}
                </button>
              </div>
              {post.caption && (
                <p className="text-sm text-zinc-700">
                  <span className="font-semibold">{post.userName}</span> {post.caption}
                </p>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Share modal */}
      {showShare && <ShareModal onClose={() => setShowShare(false)} onPosted={(post) => { setPosts(prev => [post, ...prev]); setShowShare(false) }} />}

    </div>
  )
}

function ShareModal({ onClose, onPosted }: { onClose: () => void; onPosted: (post: Post) => void }) {
  const [clothes, setClothes] = useState<{ id: string; imageUrl: string; category: string; color: string }[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [caption, setCaption] = useState("")
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/clothes")
      .then(r => r.ok ? r.json() : [])
      .then(data => setClothes(Array.isArray(data) ? data : []))
  }, [])

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handlePost() {
    if (selected.length === 0) return
    setPosting(true)
    setPostError(null)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, clothingIds: selected }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setPostError(data?.error || "Couldn't share this look. Please try again.")
        setPosting(false)
        return
      }
      const post = await res.json()
      onPosted(post)
    } catch {
      setPostError("Network error. Please try again.")
      setPosting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-zinc-900">Share a look</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-2xl">×</button>
        </div>

        <p className="text-sm text-zinc-500 mb-3">Pick items from your wardrobe:</p>

        {clothes.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">No items in wardrobe yet. <a href="/wearboard" className="text-purple-600">Add some →</a></p>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {clothes.map(item => (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  selected.includes(item.id) ? "border-zinc-900 scale-95" : "border-transparent"
                }`}
              >
                <Image src={item.imageUrl} alt={item.category} fill className="object-cover" />
                {selected.includes(item.id) && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-2xl">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Add a caption... (optional)"
          className="w-full px-4 py-3 border border-zinc-200 rounded-2xl text-sm resize-none mb-4 focus:outline-none focus:border-zinc-400"
          rows={2}
        />

        {postError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
            <p className="text-red-700 text-sm">{postError}</p>
          </div>
        )}

        <button
          onClick={handlePost}
          disabled={selected.length === 0 || posting}
          className="w-full py-3 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-700 disabled:opacity-40 transition-colors"
        >
          {posting ? "Sharing..." : `Share look (${selected.length} items)`}
        </button>
      </div>
    </div>
  )
}
