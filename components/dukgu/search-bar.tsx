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
  placeholder = "뉴스 검색",
  onRefresh,
  isRefreshing = false,
}: SearchBarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 pointer-events-none">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        suppressHydrationWarning
        autoComplete="off"
        className="w-full h-10 bg-white border border-[#E5E7EB] rounded-[10px] px-3 pl-9 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all duration-200"
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {mounted && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-0.5 transition-colors"
          >
            <X className="w-[10px] h-[10px]" />
          </button>
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-gray-400 hover:text-emerald-500 p-1 rounded-full transition-all active:rotate-180 duration-500 disabled:opacity-30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`} />
          </button>
        )}
      </div>
    </div>
  )
}
