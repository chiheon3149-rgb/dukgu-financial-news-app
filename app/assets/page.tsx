"use client"

import { DetailHeader } from "@/components/dukgu/detail-header"
import { TrendingUp } from "lucide-react"

export default function SijangPage() {
  return (
    <div className="min-h-dvh bg-[#F9FAFB] pb-20">
      <DetailHeader
        showBack={false}
        title={
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-black text-slate-900">증시</span>
          </div>
        }
      />
      <main className="max-w-md mx-auto px-5 py-20 flex flex-col items-center justify-center gap-3">
        <p className="text-4xl">📈</p>
        <p className="text-[15px] font-black text-slate-700">준비 중입니다</p>
        <p className="text-[12px] font-bold text-slate-400">곧 새로운 증시 화면이 찾아올 예정이에요!</p>
      </main>
    </div>
  )
}
