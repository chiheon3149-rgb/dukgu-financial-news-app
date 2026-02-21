"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"

export function SearchBar() {
  const [keyword, setKeyword] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    alert(`"${keyword}" (으)로 과거 뉴스를 검색합니다!`)
  }

  return (
    <form 
      onSubmit={handleSearch}
      className="relative flex items-center w-full mb-4"
    >
      {/* 돋보기 아이콘 */}
      <div className="absolute left-3.5 text-slate-400">
        <Search className="w-4 h-4" />
      </div>

      {/* 💡 기획자님 의견대로 bg-white로 변경하고, 테두리를 조금 더 선명하게 잡아줬습니다. */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="궁금한 과거 뉴스를 검색해 보세요"
        className="w-full bg-white border border-slate-200 text-sm text-slate-800 rounded-2xl py-3 pl-10 pr-10 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-slate-400 shadow-sm"
      />

      {/* 지우기 버튼 */}
      {keyword && (
        <button
          type="button"
          onClick={() => setKeyword("")}
          className="absolute right-3.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  )
}