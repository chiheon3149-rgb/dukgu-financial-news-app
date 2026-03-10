"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, ShieldCheck, Loader2, Info, History } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

// 🎨 유저 페이지와 동일한 카테고리 구성
const CATEGORY_THEMES = [
  { id: 0, label: "경제상식", icon: "📈", color: "text-blue-600", bg: "bg-blue-50" },
  { id: 1, label: "주식/투자", icon: "💰", color: "text-emerald-600", bg: "bg-emerald-50" },
  { id: 2, label: "부동산", icon: "🏠", color: "text-orange-600", bg: "bg-orange-50" },
  { id: 3, label: "금융트렌드", icon: "🔥", color: "text-purple-600", bg: "bg-purple-50" },
]

export default function AdminQuizManagePage() {
  const router = useRouter()
  const { profile, isLoading: isUserLoading } = useUser()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [weekLabel, setWeekLabel] = useState("2026-03-W1")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 💡 유저 페이지의 4개 카테고리에 맞춘 초기값
  const [quizList, setQuizList] = useState(
    Array(4).fill(null).map(() => ({
      question: "",
      options: ["", "", "", ""],
      answerIndex: 0,
      explanation: "" // 유저 페이지에선 '힌트'로 노출됨
    }))
  )

  useEffect(() => {
    const verifyAdmin = async () => {
      if (isUserLoading) return
      if (!profile?.id) { setIsChecking(false); return }

      const { data } = await supabase
        .from("profiles").select("is_admin").eq("id", profile.id).single()
      
      if (data?.is_admin) setIsAdmin(true)
      setIsChecking(false)
    }
    verifyAdmin()
  }, [profile?.id, isUserLoading])

  const handleUpdateQuiz = (qIdx: number, field: string, value: any) => {
    const newList = [...quizList]
    if (field === "options") {
      newList[qIdx].options[value.optIdx] = value.text
    } else {
      (newList[qIdx] as any)[field] = value
    }
    setQuizList(newList)
  }

  const handleSubmit = async () => {
    if (quizList.some(q => !q.question.trim())) {
      toast.error("4개 카테고리의 모든 문제를 입력해 주세요!")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekLabel, quizList }),
      })
      if (!res.ok) throw new Error("등록 실패")
      
      toast.success("이번 주 4개 카테고리 퀴즈가 배포되었습니다! 🚀")
      router.push("/mypage")
    } catch (e) {
      toast.error("등록 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking || isUserLoading) return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  )

  if (!isAdmin) return <div className="p-10 text-center font-black">접근 권한이 없습니다. 👮‍♂️</div>

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 font-sans">
      <div className="sticky top-0 bg-white border-b border-slate-100 z-10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button>
          <span className="text-[16px] font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" /> 퀴즈 출제 센터
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/mypage/quiz/admin/history"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-2xl text-[12px] font-black hover:bg-slate-200 transition-all"
          >
            <History className="w-3.5 h-3.5" /> 퀴즈 이력
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[13px] font-black active:scale-95 disabled:bg-slate-300"
          >
            {isSubmitting ? "배포 중..." : "퀴즈 배포하기"}
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 py-6 space-y-8">
        {/* 주차 레이블 */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">WEEK LABEL</label>
          <input 
            type="text" 
            value={weekLabel} 
            onChange={(e) => setWeekLabel(e.target.value)}
            placeholder="예: 2026-03-W1"
            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* 💡 카테고리별 문제 입력 섹션 */}
        {quizList.map((quiz, qIdx) => (
          <div key={qIdx} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-2xl ${CATEGORY_THEMES[qIdx].bg}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CATEGORY_THEMES[qIdx].icon}</span>
                <div>
                  <p className={`text-[13px] font-black ${CATEGORY_THEMES[qIdx].color}`}>{CATEGORY_THEMES[qIdx].label}</p>
                  <p className="text-[10px] font-bold text-slate-400">문제 {qIdx + 1} (배점: 10XP)</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 ml-1">질문 입력</label>
              <textarea 
                value={quiz.question}
                onChange={(e) => handleUpdateQuiz(qIdx, "question", e.target.value)}
                placeholder={`${CATEGORY_THEMES[qIdx].label} 관련 문제를 입력하세요`}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-[14px] font-bold min-h-[100px] resize-none outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 ml-1">보기 및 정답 설정 (숫자 클릭)</label>
              <div className="grid gap-2">
                {quiz.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateQuiz(qIdx, "answerIndex", oIdx)}
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                        quiz.answerIndex === oIdx ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {oIdx + 1}
                    </button>
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => handleUpdateQuiz(qIdx, "options", { optIdx: oIdx, text: e.target.value })}
                      placeholder={`보기 ${oIdx + 1}`}
                      className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-dashed border-slate-100">
              <div className="flex items-center gap-1.5 ml-1">
                <Info className="w-3 h-3 text-amber-500" />
                <label className="text-[11px] font-black text-slate-400 uppercase">유저 힌트 (Explanation)</label>
              </div>
              <input 
                type="text" 
                value={quiz.explanation}
                onChange={(e) => handleUpdateQuiz(qIdx, "explanation", e.target.value)}
                placeholder="유저가 힌트 보기 클릭 시 나타날 내용"
                className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}