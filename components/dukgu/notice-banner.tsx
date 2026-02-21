"use client"

import Link from "next/link"
import { Bell } from "lucide-react"

export function NoticeBanner() {
  return (
    <Link href="/notice" className="block">
      <div className="bg-blue-50/60 border border-blue-100/80 rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition-all hover:bg-blue-50 cursor-pointer">
        <Bell className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
        <p className="text-[13px] font-bold text-blue-900 leading-snug tracking-tight">
          [공지] 시스템 업데이트 작업 중입니다.
        </p>
      </div>
    </Link>
  )
}