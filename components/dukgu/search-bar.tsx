"use client"

import { Search, X } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="relative flex items-center w-full mb-3" // 여백을 살짝 줄여 상단 밀착
    >
      {/* 1. 돋보기 아이콘 - 왼쪽에 고정하여 안정감 부여 */}
      <div className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
        <Search className="w-4 h-4" />
      </div>

      {/* 2. 입력 필드 - 폰트 무게를 줄이고(font-medium) 패딩 최적화 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="태그, 제목, 내용으로 검색"
        className="w-full bg-slate-100/70 border border-transparent text-[14px] font-medium text-slate-800 rounded-xl py-2.5 pl-11 pr-10 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all placeholder:text-slate-400"
      />

      {/* 3. X 버튼 - 입력 값이 있을 때만 오른쪽 노출 */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3.5 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full p-1 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </form>
  )
}