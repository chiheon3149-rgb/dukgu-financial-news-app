"use client"

import { useState } from "react"
import { Eye, MessageCircle } from "lucide-react"

interface DukguReactionProps {
  initialGood: number
  initialBad: number
  viewCount: number
  commentCount: number
}

export function DukguReaction({ initialGood, initialBad, viewCount, commentCount }: DukguReactionProps) {
  // 💡 에러가 났던 변수들이 바로 여기 'DukguReaction' 함수 안에 정의되어 있어야 합니다!
  const [good, setGood] = useState(initialGood)
  const [bad, setBad] = useState(initialBad)
  const [userReaction, setUserReaction] = useState<"good" | "bad" | null>(null)

  const total = good + bad
  const goodPercent = total === 0 ? 50 : Math.round((good / total) * 100)
  const badPercent = total === 0 ? 50 : 100 - goodPercent

  const handleGood = () => {
    if (userReaction === "good") return
    setGood(c => c + 1)
    if (userReaction === "bad") setBad(c => c - 1)
    setUserReaction("good")
  }

  const handleBad = () => {
    if (userReaction === "bad") return
    setBad(c => c + 1)
    if (userReaction === "good") setGood(c => c - 1)
    setUserReaction("bad")
  }

  return (
    <div className="py-6 border-y border-slate-100 my-6">
      <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400 mb-6">
        <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> 조회 {viewCount.toLocaleString()}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> 댓글 {commentCount.toLocaleString()}</span>
      </div>

      <div className="flex items-center justify-center gap-8">
        {/* 좋아요 (꽉 찬 그릇) */}
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={handleGood}
            className={`text-4xl transition-transform active:scale-90 hover:scale-110 ${userReaction === "good" ? "drop-shadow-md" : "opacity-50 grayscale"}`}
          >
            🍲
          </button>
          <div className="text-center">
            <p className={`text-sm font-extrabold ${userReaction === "good" ? "text-blue-600" : "text-slate-500"}`}>맛있다냥!</p>
            <p className="text-xs font-medium text-slate-400">{goodPercent}% ({good})</p>
          </div>
        </div>

        {/* 게이지 바 */}
        <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner mt-2">
          <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${goodPercent}%` }} />
          <div className="bg-red-400 h-full transition-all duration-500" style={{ width: `${badPercent}%` }} />
        </div>

        {/* 싫어요 (빈 그릇) */}
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={handleBad}
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