"use client"

import { useEffect, useState } from "react"
import { Search, X, RefreshCw } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function SearchBar({
  value,
  onChange,
  placeholder = "태그, 제목, 내용으로 검색",
  onRefresh,
  isRefreshing = false,
}: SearchBarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative w-full shadow-sm rounded-2xl">
      {/* 돋보기 아이콘 */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center text-gray-500 pointer-events-none">
        <Search className="w-5 h-5" />
      </div>

      {/* 입력 필드 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        suppressHydrationWarning
        autoComplete="off"
        className="w-full bg-white border border-gray-300 rounded-2xl py-3.5 pl-10 pr-10 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-300 focus:shadow-sm transition-all duration-200"
      />

      {/* 우측: 삭제 버튼 or 새로고침 버튼 */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {mounted && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-gray-400 hover:text-green-500 bg-gray-100 rounded-full p-1 transition-colors"
          >
            <X className="w-[10px] h-[10px]" />
          </button>
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-gray-400 hover:text-[#00C48C] p-1 rounded-full transition-all active:rotate-180 duration-500 disabled:opacity-30"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#00C48C]" : ""}`} />
          </button>
        )}
      </div>
    </div>
  )
}
