"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, MoreVertical } from "lucide-react"

interface CommentItemProps {
  nickname: string
  profileImage: string // 💡 향후 마이페이지 이미지 URL이 이리로 들어옵니다!
  content: string
  timeAgo: string
  initialGood: number
  initialBad: number
}

export function CommentItem({ nickname, profileImage, content, timeAgo, initialGood, initialBad }: CommentItemProps) {
  // 💡 좋아요/싫어요 상태 관리 (나중엔 백엔드와 통신하게 됩니다)
  const [good, setGood] = useState(initialGood)
  const [bad, setBad] = useState(initialBad)
  const [userReaction, setUserReaction] = useState<"good" | "bad" | null>(null)

  const handleAction = (type: "edit" | "delete") => {
    if (type === "delete") {
      if (confirm("댓글을 삭제하시겠냥? 🐾")) {
        alert("삭제되었습니다냥! (백엔드 연결 시 실제 삭제)");
      }
    } else {
      alert("수정 모드로 전환합니다냥!");
    }
  }

  return (
    <div className="flex gap-3 py-4 border-b border-slate-50 last:border-0 group">
      {/* 🖼️ 프로필 영역: 나중에 마이페이지에서 이미지를 등록하면 profileImage 경로만 바꿔주면 끝! */}
      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200/50">
        <img src={profileImage} alt={nickname} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-800">{nickname}</span>
            <span className="text-[10px] font-medium text-slate-400">{timeAgo}</span>
          </div>

          {/* 💡 세로 점 3개 메뉴: 여기서 수정/삭제 기능을 기획합니다 */}
          <div className="relative">
            <button className="p-1 text-slate-300 hover:text-slate-500 transition-colors">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {/* 실무에선 클릭 시 팝업이 뜨게 하지만, 지금은 간단하게 버튼 근처에 숨겨둘게요 */}
            <div className="hidden group-hover:flex absolute right-0 top-6 bg-white border border-slate-100 shadow-xl rounded-lg py-1 z-10 min-w-[60px] flex-col">
              <button onClick={() => handleAction("edit")} className="text-[10px] py-1.5 hover:bg-slate-50 font-bold text-slate-600">수정</button>
              <button onClick={() => handleAction("delete")} className="text-[10px] py-1.5 hover:bg-slate-50 font-bold text-red-500">삭제</button>
            </div>
          </div>
        </div>

        {/* 댓글 본문 */}
        <p className="text-[13px] text-slate-600 leading-relaxed mb-3 break-all font-medium">
          {content}
        </p>

        {/* 🍲 좋아요/싫어요 버튼 쌍 (사료 그릇 컨셉 유지) */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if(userReaction === 'good') return;
              setGood(g => g + 1);
              if(userReaction === 'bad') setBad(b => b - 1);
              setUserReaction('good');
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${userReaction === 'good' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <ThumbsUp className={`w-3 h-3 ${userReaction === 'good' ? 'fill-blue-600' : ''}`} />
            <span className="text-[10px] font-bold">{good}</span>
          </button>

          <button 
            onClick={() => {
              if(userReaction === 'bad') return;
              setBad(b => b + 1);
              if(userReaction === 'good') setGood(g => g - 1);
              setUserReaction('bad');
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${userReaction === 'bad' ? 'bg-red-50 text-red-500' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <ThumbsDown className={`w-3 h-3 ${userReaction === 'bad' ? 'fill-red-500' : ''}`} />
            <span className="text-[10px] font-bold">{bad}</span>
          </button>
        </div>
      </div>
    </div>
  )
}