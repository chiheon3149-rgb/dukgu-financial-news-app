"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, MessageCircle, Bookmark } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface InteractionBarProps {
  newsId?: string
  initialGood: number;
  initialBad: number;
  commentCount: number;
  initialSaved?: boolean;
}

export function NewsInteractionBar({
  newsId,
  initialGood,
  initialBad,
  commentCount,
  initialSaved = false
}: InteractionBarProps) {

  const reactionKey = newsId ? `news_reaction_${newsId}` : null

  // localStorage에서 이전 반응 복원
  const [reaction, setReaction] = useState<"good" | "bad" | null>(() => {
    if (typeof window === "undefined" || !reactionKey) return null
    return localStorage.getItem(reactionKey) as "good" | "bad" | null
  })

  const [good, setGood] = useState(initialGood)
  const [bad, setBad] = useState(initialBad)
  const [isSaved, setIsSaved] = useState(initialSaved)

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (reaction === "good") return
    const newGood = good + 1
    const newBad = reaction === "bad" ? bad - 1 : bad
    setGood(newGood)
    if (reaction === "bad") setBad(newBad)
    setReaction("good")
    if (reactionKey) localStorage.setItem(reactionKey, "good")
    if (newsId) {
      await supabase.from("news").update({ good_count: newGood, bad_count: newBad }).eq("id", newsId)
    }
  }

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (reaction === "bad") return
    const newBad = bad + 1
    const newGood = reaction === "good" ? good - 1 : good
    setBad(newBad)
    if (reaction === "good") setGood(newGood)
    setReaction("bad")
    if (reactionKey) localStorage.setItem(reactionKey, "bad")
    if (newsId) {
      await supabase.from("news").update({ good_count: newGood, bad_count: newBad }).eq("id", newsId)
    }
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
            reaction === "good" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${reaction === "good" ? "fill-blue-600" : ""}`} />
          <span className="text-[10px] font-bold">{good}</span>
        </button>

        {/* 싫어요 */}
        <button
          onClick={handleDislike}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all active:scale-95 ${
            reaction === "bad" ? "bg-red-50 text-red-500" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsDown className={`w-3.5 h-3.5 ${reaction === "bad" ? "fill-red-500" : ""}`} />
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
