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
      className="relative flex items-center w-full mb-4"
    >
      {/* 돋보기 — 입력 중일 때 왼쪽 (검색 실행 버튼) */}
      {value && (
        <button
          type="submit"
          className="absolute left-3.5 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="태그 제목 내용으로 검색하세요"
        className={`w-full bg-white border border-slate-200 text-sm text-slate-800 rounded-2xl py-3 pr-10 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-slate-400 shadow-sm ${
          value ? "pl-10" : "pl-4"
        }`}
      />

      {/* 돋보기 — 기본 상태일 때 오른쪽 */}
      {!value && (
        <button
          type="submit"
          className="absolute right-3.5 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {/* X 버튼 — 입력 중일 때 오른쪽 (초기화) */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  )
}
