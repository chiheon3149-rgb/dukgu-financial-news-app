"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { MyPageQuizBanner } from "@/components/dukgu/mypage-quiz-banner"

export default function QuizPage() {
  const router = useRouter()

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-[16px] font-black text-slate-900">이번 주 상식 퀴즈</span>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 py-5">
        <MyPageQuizBanner />
      </main>
    </div>
  )
}
