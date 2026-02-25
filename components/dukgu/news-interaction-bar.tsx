"use client"

import { ThumbsUp, ThumbsDown, MessageCircle, Bookmark } from "lucide-react"
import { useNewsReaction } from "@/hooks/use-news-reaction"
import { useSavedArticles } from "@/hooks/use-saved-articles"
import type { NewsCategory } from "@/types"

interface InteractionBarProps {
  newsId?: string
  initialGood: number
  initialBad: number
  commentCount: number
  snapshot?: {
    headline: string
    category: NewsCategory
    timeAgo: string
    tags?: string[]
  }
}

export function NewsInteractionBar({
  newsId,
  initialGood,
  initialBad,
  commentCount,
  snapshot,
}: InteractionBarProps) {
  const { good, bad, userReaction, react } = useNewsReaction(
    newsId ?? "",
    initialGood,
    initialBad
  )
  const { isSaved, toggleSave } = useSavedArticles()
  const saved = newsId ? isSaved(newsId) : false

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    react("good", snapshot)
  }

  const handleDislike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    react("bad", snapshot)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!newsId || !snapshot) return
    toggleSave(newsId, snapshot)
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
      
      {/* 👍 좋아요 & 싫어요 캡슐형 UI (민트 & 로즈) */}
      <div className="flex items-center gap-1 bg-slate-100/60 p-1 rounded-2xl">
        {/* 좋아요 버튼 (Blue -> Emerald) */}
        <button
          onClick={handleLike}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90
            ${userReaction === "good" 
              ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5" 
              : "text-slate-400 hover:text-emerald-500"}
          `}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === "good" ? "fill-emerald-500" : ""}`} />
          <span className="text-[12px] font-extrabold tabular-nums">{good}</span>
        </button>

        {/* 구분선 */}
        <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

        {/* 싫어요 버튼 (Red -> Rose: 민트와 더 잘 어울리는 따뜻한 레드) */}
        <button
          onClick={handleDislike}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90
            ${userReaction === "bad" 
              ? "bg-white text-rose-500 shadow-sm ring-1 ring-black/5" 
              : "text-slate-400 hover:text-rose-400"}
          `}
        >
          <ThumbsDown className={`w-3.5 h-3.5 ${userReaction === "bad" ? "fill-rose-500" : ""}`} />
          <span className="text-[12px] font-extrabold tabular-nums">{bad}</span>
        </button>
      </div>

      {/* 💬 댓글 카운트 & 북마크 버튼 */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 px-3 py-2 text-slate-400">
          <MessageCircle className="w-4 h-4" />
          <span className="text-[12px] font-bold tabular-nums">{commentCount}</span>
        </div>

        {/* 북마크 버튼 (Blue -> Emerald) */}
        <button
          onClick={handleBookmark}
          className={`
            p-2.5 rounded-full transition-all duration-200 active:scale-90
            ${saved 
              ? "text-emerald-500 bg-emerald-50" 
              : "text-slate-300 hover:bg-slate-50 hover:text-emerald-400"}
          `}
        >
          <Bookmark className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>
    </div>
  )
}