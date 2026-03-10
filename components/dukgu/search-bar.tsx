"use client"

import { useEffect, useState } from "react"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "태그, 제목, 내용으로 검색" 
}: SearchBarProps) {
  // 하이드레이션 오류 방지를 위한 마운트 상태 관리
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 서버와 클라이언트의 결과가 다를 수 있는 부분은 마운트 후에만 렌더링하거나 
  // suppressHydrationWarning을 사용합니다.
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="relative flex items-center w-full mb-1 group"
      suppressHydrationWarning // 브라우저 확장 프로그램의 개입 허용
    >
      {/* 1. 돋보기 아이콘 */}
      <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
        <Search className="w-4 h-4" />
      </div>

      {/* 2. 입력 필드 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // 브라우저의 자동 완성 기능이 DOM을 조작해도 에러를 띄우지 않도록 설정
        suppressHydrationWarning 
        autoComplete="off" 
        className={`
          w-full text-[14px] font-medium text-slate-700 rounded-xl
          py-2.5 pl-11 pr-10 transition-all placeholder:text-slate-400
          bg-white border border-slate-200 shadow-inner
          focus:outline-none focus:border-emerald-400
          focus:ring-2 focus:ring-emerald-400/20
        `}
      />

      {/* 3. 삭제 버튼 */}
      {mounted && value && (
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