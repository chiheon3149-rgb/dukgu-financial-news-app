"use client"

import { useRouter } from "next/navigation"
import { ThumbsUp, ThumbsDown, MessageCircle, Bookmark } from "lucide-react"
import { toast } from "sonner"
import { useNewsReaction } from "@/hooks/use-news-reaction"
import { useSavedArticles } from "@/hooks/use-saved-articles"
import { useUser } from "@/context/user-context"
import type { NewsCategory } from "@/types"

interface InteractionBarProps {
  newsId?: string
  initialGood: number
  initialBad: number
  commentCount: number
  timeAgo?: string
  showDislike?: boolean
  showEmojiActions?: boolean
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
  timeAgo,
  showDislike = true,
  showEmojiActions = false,
  snapshot,
}: InteractionBarProps) {
  const router = useRouter()
  const { profile } = useUser()
  const { good, bad, userReaction, react } = useNewsReaction(
    newsId ?? "",
    initialGood,
    initialBad
  )
  const { isSaved, toggleSave } = useSavedArticles()
  const saved = newsId ? isSaved(newsId) : false

  const checkLogin = (message: string) => {
    if (!profile) {
      toast("로그인이 필요한 기능이다냥! 🐾", {
        description: message,
        action: {
          label: "로그인하기",
          onClick: () => router.push("/login"),
        },
      })
      return false
    }
    return true
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!checkLogin("좋아요를 누르려면 덕구네 식구가 되어 달라냥.")) return
    react("good", snapshot)
  }

  const handleDislike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!checkLogin("리액션을 남기려면 덕구네 식구가 되어 달라냥.")) return
    react("bad", snapshot)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!checkLogin("기사를 저장하려면 덕구네 식구가 되어 달라냥.")) return
    if (!newsId || !snapshot) return
    toggleSave(newsId, snapshot)
    if (!saved) toast.success("간식 창고(북마크)에 저장했다냥! 🐾")
  }

  // ── 카드 하단 이모지 액션 바 ──────────────────────────────
  if (showEmojiActions) {
    return (
      <div className="flex items-center gap-5">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 transition-all duration-200 active:scale-90"
        >
          <span className="text-[15px] leading-none">{userReaction === "good" ? "👍" : "👍"}</span>
          <span className={`text-[12px] font-medium transition-colors ${userReaction === "good" ? "text-emerald-600" : "text-gray-400"}`}>
            좋아요{good > 0 ? ` ${good}` : ""}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-[15px] leading-none">💬</span>
          <span className="text-[12px] font-medium text-gray-400">
            댓글{commentCount > 0 ? ` ${commentCount}` : ""}
          </span>
        </div>

        <button
          onClick={handleBookmark}
          className="flex items-center gap-1.5 transition-all duration-200 active:scale-90"
        >
          <span className="text-[15px] leading-none">🔖</span>
          <span className={`text-[12px] font-medium transition-colors ${saved ? "text-emerald-600" : "text-gray-400"}`}>
            북마크
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">

      {/* 왼쪽: 시간 (카드 뷰) 또는 좋아요+싫어요+댓글 (상세 뷰) */}
      {timeAgo ? (
        <span className="text-[12px] text-gray-400">{timeAgo}</span>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 transition-all duration-200 active:scale-90"
          >
            <ThumbsUp className={`w-4 h-4 transition-colors ${userReaction === "good" ? "fill-emerald-500 text-emerald-500" : "text-slate-300"}`} />
            <span className={`text-[12px] font-semibold tabular-nums transition-colors ${userReaction === "good" ? "text-emerald-600" : good > 0 ? "text-slate-500" : "text-slate-300"}`}>
              {good}
            </span>
          </button>

          {showDislike && (
            <button
              onClick={handleDislike}
              className="flex items-center gap-1.5 transition-all duration-200 active:scale-90"
            >
              <ThumbsDown className={`w-4 h-4 transition-colors ${userReaction === "bad" ? "fill-rose-400 text-rose-400" : "text-slate-300"}`} />
              <span className={`text-[12px] font-semibold tabular-nums transition-colors ${userReaction === "bad" ? "text-rose-500" : bad > 0 ? "text-slate-500" : "text-slate-300"}`}>
                {bad}
              </span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-slate-300">
            <MessageCircle className="w-4 h-4" />
            <span className="text-[12px] font-semibold tabular-nums">{commentCount}</span>
          </div>
        </div>
      )}

      {/* 오른쪽: 카드 뷰 — 좋아요+댓글+북마크 */}
      {timeAgo ? (
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 transition-all duration-200 active:scale-90"
          >
            <ThumbsUp className={`w-4 h-4 transition-colors ${userReaction === "good" ? "fill-emerald-500 text-emerald-500" : "text-gray-300"}`} />
            <span className={`text-[12px] font-medium tabular-nums transition-colors ${userReaction === "good" ? "text-emerald-600" : "text-gray-400"}`}>
              {good}
            </span>
          </button>

          <div className="flex items-center gap-1.5 text-gray-300">
            <MessageCircle className="w-4 h-4" />
            <span className="text-[12px] font-medium tabular-nums text-gray-400">{commentCount}</span>
          </div>

          <button
            onClick={handleBookmark}
            className={`transition-all duration-200 active:scale-90 ${
              saved ? "text-emerald-500" : "text-gray-300 hover:text-gray-500"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
      ) : (
        /* 상세 뷰 — 북마크만 우측 */
        <button
          onClick={handleBookmark}
          className={`p-1.5 rounded-lg transition-all duration-200 active:scale-90 ${
            saved ? "text-emerald-500 bg-emerald-50" : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </button>
      )}
    </div>
  )
}
