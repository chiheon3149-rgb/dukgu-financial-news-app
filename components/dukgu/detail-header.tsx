"use client"

import React from "react"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface DetailHeaderProps {
  title: React.ReactNode
  showBack?: boolean // 🚀 뒤로가기 버튼 표시 여부 (기본값은 true로 설정 가능)
}

export function DetailHeader({ title, showBack = true }: DetailHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white/80 backdrop-blur-md px-5 py-4 flex items-center gap-3 border-b border-slate-100 sticky top-0 z-30">
      {/* 🚀 showBack이 true일 때만 버튼을 보여줍니다 */}
      {showBack && (
        <button 
          onClick={() => router.back()} 
          className="p-1 -ml-1 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-900" />
        </button>
      )}
      <div className="flex-1">
        {typeof title === "string" ? (
          <h1 className="text-[17px] font-black text-slate-900 tracking-tight">{title}</h1>
        ) : (
          title
        )}
      </div>
    </header>
  )
}