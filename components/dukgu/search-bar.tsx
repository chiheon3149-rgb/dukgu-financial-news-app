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
      className="relative flex items-center w-full mb-1 group"
    >
      {/* 1. 돋보기 아이콘 */}
      <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
        <Search className="w-4 h-4" />
      </div>

      {/* 2. 입력 필드 - 비활성 상태의 가시성을 높였습니다. */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="태그, 제목, 내용으로 검색"
        className={`
          w-full text-[14px] font-medium text-slate-800 rounded-xl 
          py-2.5 pl-11 pr-10 transition-all placeholder:text-slate-400
          
          /* 비활성 상태: 배경을 살짝 더 진하게 하고, 테두리를 명확히 부여 */
          bg-slate-100/80 border border-slate-200 
          
          /* 활성 상태 (민트 포인트) */
          focus:outline-none focus:bg-white 
          focus:ring-4 focus:ring-emerald-500/10 
          focus:border-emerald-400
          hover:border-slate-300
        `}
      />

      {/* 3. X 버튼 */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3.5 text-slate-400 hover:text-emerald-600 bg-slate-200/50 rounded-full p-1 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </form>
  )
}