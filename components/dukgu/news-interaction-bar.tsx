"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, MessageCircle, Bookmark } from "lucide-react"
import { useNewsReaction } from "@/hooks/use-news-reaction"

interface InteractionBarProps {
  newsId?: string
  initialGood: number
  initialBad: number
  commentCount: number
  initialSaved?: boolean
}

export function NewsInteractionBar({
  newsId,
  initialGood,
  initialBad,
  commentCount,
  initialSaved = false,
}: InteractionBarProps) {
  const { good, bad, userReaction, react } = useNewsReaction(
    newsId ?? "",
    initialGood,
    initialBad
  )
  const [isSaved, setIsSaved] = useState(initialSaved)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    react("good")
  }

  const handleDislike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    react("bad")
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSaved(!isSaved)
  }

  return (
    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
      <div className="flex items-center gap-1">
        {/* 좋아요 */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all active:scale-95 ${
            userReaction === "good" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === "good" ? "fill-blue-600" : ""}`} />
          <span className="text-[10px] font-bold">{good}</span>
        </button>

        {/* 싫어요 */}
        <button
          onClick={handleDislike}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all active:scale-95 ${
            userReaction === "bad" ? "bg-red-50 text-red-500" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsDown className={`w-3.5 h-3.5 ${userReaction === "bad" ? "fill-red-500" : ""}`} />
          <span className="text-[10px] font-bold">{bad}</span>
        </button>
      </div>

      <div className="flex items-center gap-1">
        {/* 댓글 */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400">
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">{commentCount}</span>
        </div>

        {/* 북마크 */}
        <button
          onClick={handleBookmark}
          className={`p-2 rounded-full transition-all active:scale-95 ${
            isSaved ? "text-blue-500" : "text-slate-300 hover:bg-slate-50"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>
    </div>
  )
}
