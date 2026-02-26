"use client"

import { useRouter } from "next/navigation"
import { Eye, MessageCircle } from "lucide-react"
import { toast } from "sonner"
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

  // 💡 [핵심 수정] 리액션 클릭 시 통일된 로그인 유도 팝업 적용
  const handleReact = (type: "good" | "bad") => {
    if (!profile) {
      toast("로그인이 필요한 기능이다냥! 🐾", {
        description: "이 뉴스가 유익했다면 덕구네 식구가 되어 달라냥.",
        action: {
          label: "로그인하기",
          onClick: () => router.push("/login"),
        },
      })
      return // ⚠️ 강제 이동을 제거하고 팝업만 띄운 뒤 함수를 종료합니다.
    }
    react(type, snapshot)
  }

  const total = good + bad
  const goodPercent = total === 0 ? 50 : Math.round((good / total) * 100)
  const badPercent = total === 0 ? 50 : 100 - goodPercent

  return (
    <div className="py-8 border-y border-slate-50 my-8">
      {/* 1. 상단 정보 (조회/댓글) */}
      <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-slate-400 mb-8 tracking-tight">
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full">
          <Eye className="w-3.5 h-3.5" /> 조회 {viewCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full">
          <MessageCircle className="w-3.5 h-3.5" /> 댓글 {commentCount.toLocaleString()}
        </span>
      </div>

      {/* 2. 메인 리액션 컨트롤러 */}
      <div className="flex items-center justify-center gap-6">
        
        {/* 👍 맛있다냥 영역 */}
        <div className="flex flex-col items-center gap-3 min-w-[80px]">
          <button
            onClick={() => handleReact("good")}
            className={`text-4xl transition-all active:scale-90 hover:scale-110 
              ${userReaction === "good" 
                ? "drop-shadow-[0_4px_10px_rgba(16,185,129,0.4)] saturate-150" 
                : "opacity-40 grayscale hover:grayscale-0 hover:opacity-100"}`}
          >
            🍲
          </button>
          <div className="text-center">
            <p className={`text-[13px] font-black transition-colors ${userReaction === "good" ? "text-emerald-600" : "text-slate-500"}`}>
              맛있다냥!
            </p>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">{goodPercent}% ({good})</p>
          </div>
        </div>

        {/* 📊 중앙 진행 바 (민트 vs 로즈) */}
        <div className="flex-1 max-w-[120px] h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner relative ring-4 ring-slate-50">
          <div 
            className="bg-emerald-500 h-full transition-all duration-700 ease-out shadow-[1px_0_4px_rgba(0,0,0,0.1)]" 
            style={{ width: `${goodPercent}%` }} 
          />
          <div 
            className="bg-rose-400 h-full transition-all duration-700 ease-out" 
            style={{ width: `${badPercent}%` }} 
          />
        </div>

        {/* 🍽️ 배고프냥 영역 */}
        <div className="flex flex-col items-center gap-3 min-w-[80px]">
          <button
            onClick={() => handleReact("bad")}
            className={`text-4xl transition-all active:scale-90 hover:scale-110 
              ${userReaction === "bad" 
                ? "drop-shadow-[0_4px_10px_rgba(244,63,94,0.4)] saturate-150" 
                : "opacity-40 grayscale hover:grayscale-0 hover:opacity-100"}`}
          >
            🍽️
          </button>
          <div className="text-center">
            <p className={`text-[13px] font-black transition-colors ${userReaction === "bad" ? "text-rose-500" : "text-slate-500"}`}>
              배고프냥...
            </p>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">{badPercent}% ({bad})</p>
          </div>
        </div>

      </div>
    </div>
  )
}