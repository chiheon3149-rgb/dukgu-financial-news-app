"use client"

import { useRouter } from "next/navigation"
import { Eye, MessageCircle } from "lucide-react"
import { useNewsReaction } from "@/hooks/use-news-reaction"
import { useUser } from "@/context/user-context"

interface DukguReactionProps {
  initialGood: number
  initialBad: number
  viewCount: number
  commentCount: number
  newsId?: string
  snapshot?: { headline: string; category: string; timeAgo: string }
}

export function DukguReaction({ initialGood, initialBad, viewCount, commentCount, newsId, snapshot }: DukguReactionProps) {
  const { profile } = useUser()
  const router = useRouter()
  const { good, bad, userReaction, react } = useNewsReaction(
    newsId ?? "",
    initialGood,
    initialBad
  )

  const handleReact = (type: "good" | "bad") => {
    if (!profile) {
      alert("로그인 후 이용 가능합니다.")
      router.push("/login")
      return
    }
    react(type, snapshot)
  }

  const total = good + bad
  const goodPercent = total === 0 ? 50 : Math.round((good / total) * 100)
  const badPercent = total === 0 ? 50 : 100 - goodPercent

  return (
    <div className="py-6 border-y border-slate-100 my-6">
      <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400 mb-6">
        <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> 조회 {viewCount.toLocaleString()}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> 댓글 {commentCount.toLocaleString()}</span>
      </div>

      <div className="flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => handleReact("good")}
            className={`text-4xl transition-transform active:scale-90 hover:scale-110 ${userReaction === "good" ? "drop-shadow-md" : "opacity-50 grayscale"}`}
          >
            🍲
          </button>
          <div className="text-center">
            <p className={`text-sm font-extrabold ${userReaction === "good" ? "text-blue-600" : "text-slate-500"}`}>맛있다냥!</p>
            <p className="text-xs font-medium text-slate-400">{goodPercent}% ({good})</p>
          </div>
        </div>

        <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner mt-2">
          <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${goodPercent}%` }} />
          <div className="bg-red-400 h-full transition-all duration-500" style={{ width: `${badPercent}%` }} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => handleReact("bad")}
            className={`text-4xl transition-transform active:scale-90 hover:scale-110 ${userReaction === "bad" ? "drop-shadow-md" : "opacity-50 grayscale"}`}
          >
            🍽️
          </button>
          <div className="text-center">
            <p className={`text-sm font-extrabold ${userReaction === "bad" ? "text-red-500" : "text-slate-500"}`}>배고프냥!</p>
            <p className="text-xs font-medium text-slate-400">{badPercent}% ({bad})</p>
          </div>
        </div>
      </div>
    </div>
  )
}
