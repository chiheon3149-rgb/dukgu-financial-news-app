"use client"

import React from "react"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface DetailHeaderProps {
  title: React.ReactNode
  /** 뒤로가기 버튼 표시 여부 (기본: true) */
  showBack?: boolean
  /** 다크 모드 (trivia 등 어두운 배경에서 사용) */
  isDark?: boolean
  /** 우측 커스텀 요소 (홈 버튼, 아이콘 등) */
  rightElement?: React.ReactNode
  /** 커스텀 뒤로가기 동작 (없으면 router.back()) */
  onBack?: () => void
}

export function DetailHeader({
  title,
  showBack = true,
  isDark = false,
  rightElement,
  onBack,
}: DetailHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) onBack()
    else router.back()
  }

  return (
    <header
      className={`px-5 py-4 flex items-center gap-3 border-b sticky top-0 z-30 ${
        isDark
          ? "bg-black/20 backdrop-blur-md border-white/10"
          : "bg-white/80 backdrop-blur-md border-slate-100"
      }`}
    >
      {showBack && (
        <button
          onClick={handleBack}
          className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft className={`w-6 h-6 ${isDark ? "text-white" : "text-slate-900"}`} />
        </button>
      )}

      <div className="flex-1">
        {typeof title === "string" ? (
          <h1 className={`text-[17px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            {title}
          </h1>
        ) : (
          title
        )}
      </div>

      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </header>
  )
}
