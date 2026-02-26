"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ThumbsUp, ThumbsDown, MessageCircle, MoreVertical, Pencil, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import type { CommunityPost } from "@/types"

interface CommunityPostCardProps {
  post: CommunityPost
  onReact: (postId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => void
  onDelete?: (postId: string) => Promise<void>
  currentUserId?: string
  onProfileClick?: (authorId: string) => void
}

const CATEGORY_LABEL: Record<string, string> = {
  free: "자유",
  economy: "경제",
}

const CATEGORY_COLOR: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  economy: "bg-emerald-50 text-emerald-700",
}

export function CommunityPostCard({ post, onReact, onDelete, currentUserId, onProfileClick }: CommunityPostCardProps) {
  const router = useRouter()
  const REACTION_KEY = "dukgu:community_post_reactions"
  
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const cache = JSON.parse(localStorage.getItem(REACTION_KEY) ?? "{}")
      return (cache[post.id] ?? null) as "like" | "dislike" | null
    } catch { return null }
  })
  
  const [counts, setCounts] = useState({ like: post.likeCount, dislike: post.dislikeCount })
  const [menuOpen, setMenuOpen] = useState(false)

  const isMyPost = !!currentUserId && post.authorId === currentUserId

  const handleReact = (type: "like" | "dislike") => {
    const isToggleOff = reaction === type
    const newReaction = isToggleOff ? null : type

    setCounts((prev) => ({
      like: type === "like" 
        ? (isToggleOff ? Math.max(0, prev.like - 1) : prev.like + 1)
        : (reaction === "like" ? Math.max(0, prev.like - 1) : prev.like),
      dislike: type === "dislike" 
        ? (isToggleOff ? Math.max(0, prev.dislike - 1) : prev.dislike + 1)
        : (reaction === "dislike" ? Math.max(0, prev.dislike - 1) : prev.dislike),
    }))

    onReact(post.id, type, reaction)
    setReaction(newReaction)

    try {
      const cache = JSON.parse(localStorage.getItem(REACTION_KEY) ?? "{}")
      if (newReaction) cache[post.id] = newReaction
      else delete cache[post.id]
      localStorage.setItem(REACTION_KEY, JSON.stringify(cache))
    } catch {}
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)

    // ✨ 비서가 지적한 에러 완벽 해결: onClick 추가
    toast("게시글을 삭제하시겠습니까?", {
      action: { 
        label: "삭제", 
        onClick: () => {
          onDelete?.(post.id)
            .then(() => toast.success("게시글이 삭제되었다냥! 🐾"))
            .catch(() => toast.error("삭제 중 오류가 발생했다냥! 😿"))
        } 
      },
      cancel: { label: "취소", onClick: () => {} },
    })
  }

  return (
    <article
      className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
      onClick={() => setMenuOpen(false)}
    >
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <button
          onClick={(e) => { e.preventDefault(); onProfileClick?.(post.authorId) }}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity active:scale-95"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-base">
            {post.authorEmoji}
          </div>
          <div className="text-left">
            <p className="text-[12px] font-black text-slate-700">{post.authorNickname}</p>
            <p className="text-[9px] font-bold text-slate-400">Lv.{post.authorLevel} · {post.timeAgo}</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${CATEGORY_COLOR[post.category as keyof typeof CATEGORY_COLOR]}`}>
            {CATEGORY_LABEL[post.category as keyof typeof CATEGORY_LABEL]}
          </span>

          {isMyPost && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v) }}
                className="p-1 text-slate-300 hover:text-slate-500"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 bg-white border border-slate-100 shadow-xl rounded-2xl py-1.5 z-20 min-w-[110px] animate-in fade-in-0 zoom-in-95 duration-100">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); router.push(`/community/${post.id}/edit`) }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 text-left"
                  >
                    <Pencil className="w-3 h-3" /> 수정하기
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-rose-500 hover:bg-rose-50 text-left"
                  >
                    <Trash2 className="w-3 h-3" /> 삭제하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Link href={`/community/${post.id}`} className="block px-5 pb-3">
        <h3 className="text-[14px] font-black text-slate-800 mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
          {post.content}
        </p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-bold text-blue-500">#{tag}</span>
            ))}
          </div>
        )}
      </Link>

      <div className="px-5 pb-4 flex items-center gap-3 border-t border-slate-50 pt-3">
        <button
          onClick={(e) => { e.preventDefault(); handleReact("like"); }}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all active:scale-95 ${
            reaction === "like" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${reaction === "like" ? "fill-emerald-500" : ""}`} />
          <span className="text-[11px] font-black">{counts.like}</span>
        </button>

        <button
          onClick={(e) => { e.preventDefault(); handleReact("dislike"); }}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all active:scale-95 ${
            reaction === "dislike" ? "bg-rose-50 text-rose-500" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsDown className={`w-3.5 h-3.5 ${reaction === "dislike" ? "fill-rose-500" : ""}`} />
          <span className="text-[11px] font-black">{counts.dislike}</span>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">{post.viewCount || 0}</span>
          </div>

          <Link href={`/community/${post.id}`} className="flex items-center gap-1 text-slate-400">
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">{post.commentCount}</span>
          </Link>
        </div>
      </div>
    </article>
  )
}