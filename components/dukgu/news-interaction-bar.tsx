"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, MessageCircle, Bookmark } from "lucide-react"

interface InteractionBarProps {
  initialGood: number;
  initialBad: number;
  commentCount: number;
  initialSaved?: boolean; // 💡 홈 화면에서 '저장됨' 상태를 결정하는 열쇠
}

export function NewsInteractionBar({ 
  initialGood, 
  initialBad, 
  commentCount, 
  initialSaved = false 
}: InteractionBarProps) {
  
  // 1. 좋아요/싫어요 상태 (따봉 로직)
  const [reaction, setReaction] = useState<"good" | "bad" | null>(null)
  
  // 2. 북마크 상태 (활성화 여부)
  const [isSaved, setIsSaved] = useState(initialSaved)

  // 클릭 이벤트가 카드 전체(상세페이지 이동)로 퍼지는 걸 막기 위해 stopPropagation을 씁니다.
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReaction(reaction === "good" ? null : "good");
  }

  const handleDislike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReaction(reaction === "bad" ? null : "bad");
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
  }

  return (
    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
      <div className="flex items-center gap-1">
        {/* 👍 좋아요 (따봉) */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all active:scale-95 ${
            reaction === "good" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${reaction === "good" ? "fill-blue-600" : ""}`} />
          <span className="text-[10px] font-bold">
            {reaction === "good" ? initialGood + 1 : initialGood}
          </span>
        </button>

        {/* 👎 싫어요 (역따봉) */}
        <button
          onClick={handleDislike}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all active:scale-95 ${
            reaction === "bad" ? "bg-red-50 text-red-500" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsDown className={`w-3.5 h-3.5 ${reaction === "bad" ? "fill-red-500" : ""}`} />
          <span className="text-[10px] font-bold">
            {reaction === "bad" ? initialBad + 1 : initialBad}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-1">
        {/* 댓글 아이콘 */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400">
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">{commentCount}</span>
        </div>

        {/* 🔖 북마크 (저장하기) */}
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