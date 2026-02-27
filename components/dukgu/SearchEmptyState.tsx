"use client"

import { SearchX } from "lucide-react"

interface SearchEmptyStateProps {
  keyword: string
}

export function SearchEmptyState({ keyword }: SearchEmptyStateProps) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
      {/* 1. 덕구의 빈 주머니 아이콘 */}
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 relative">
        <SearchX className="w-10 h-10 text-slate-300" />
        <span className="absolute -bottom-1 -right-1 text-2xl">🐾</span>
      </div>

      {/* 2. 기획자님이 제안하신 스마트 문구 로직 */}
      <h3 className="text-slate-900 font-black text-lg mb-1 tracking-tight">
        {keyword 
          ? `'${keyword}' 곳간엔 없다냥...` 
          : "아직 준비된 내용이 없다냥..."
        }
      </h3>

      {/* 3. 보조 안내 문구 */}
      <p className="text-slate-400 text-sm font-medium break-keep px-10 leading-relaxed">
        {keyword 
          ? "덕구가 열심히 뒤져봤는데 결과가 없어요.\n다른 키워드로 다시 검색해볼까요?"
          : "덕구가 새로운 소식을 물어오기 위해\n열심히 달리고 있어요. 조금만 기다려주세요!"
        }
      </p>
    </div>
  )
}