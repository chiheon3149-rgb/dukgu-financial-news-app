"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, History, ShieldCheck, Loader2, Users, Star, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

const CATEGORY_THEMES = [
  { label: "경제상식", icon: "📈", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "주식/투자", icon: "💰", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "부동산",   icon: "🏠", color: "text-orange-600", bg: "bg-orange-50" },
  { label: "금융트렌드", icon: "🔥", color: "text-purple-600", bg: "bg-purple-50" },
]

interface Quiz {
  id: string
  week_label: string
  question: string
  options: string[]
  answer_index: number
  explanation: string
}

interface QuizStats {
  week_label: string
  quizzes: Quiz[]
  total_participants: number
  avg_score: number
  perfect_count: number
  perfect_rate: number
  total_xp: number
}

export default function QuizHistoryPage() {
  const router = useRouter()
  const { profile, isLoading: isUserLoading } = useUser()

  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [stats, setStats] = useState<QuizStats[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  useEffect(() => {
    const verify = async () => {
      if (isUserLoading) return
      if (!profile?.id) { setIsChecking(false); return }
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", profile.id).single()
      if (data?.is_admin) setIsAdmin(true)
      setIsChecking(false)
    }
    verify()
  }, [profile?.id, isUserLoading])

  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      setIsLoading(true)
      try {
        // 퀴즈 목록
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("*")
          .order("week_label", { ascending: false })
          .order("id", { ascending: true })

        // 퀴즈 결과 통계
        const { data: results } = await supabase
          .from("quiz_results")
          .select("week_label, score, xp_earned")

        if (!quizzes) { setIsLoading(false); return }

        // week_label별 그룹화
        const weekMap: Record<string, Quiz[]> = {}
        quizzes.forEach((q: Quiz) => {
          if (!weekMap[q.week_label]) weekMap[q.week_label] = []
          weekMap[q.week_label].push(q)
        })

        // 결과 통계 집계
        const resultMap: Record<string, { total: number; scoreSum: number; perfectCount: number; xpSum: number }> = {}
        if (results) {
          results.forEach((r: { week_label: string; score: number; xp_earned: number }) => {
            if (!resultMap[r.week_label]) resultMap[r.week_label] = { total: 0, scoreSum: 0, perfectCount: 0, xpSum: 0 }
            resultMap[r.week_label].total++
            resultMap[r.week_label].scoreSum += r.score
            if (r.score === 4) resultMap[r.week_label].perfectCount++
            resultMap[r.week_label].xpSum += r.xp_earned
          })
        }

        const statsArr: QuizStats[] = Object.keys(weekMap)
          .sort((a, b) => b.localeCompare(a))
          .map((week) => {
            const r = resultMap[week] ?? { total: 0, scoreSum: 0, perfectCount: 0, xpSum: 0 }
            return {
              week_label: week,
              quizzes: weekMap[week],
              total_participants: r.total,
              avg_score: r.total > 0 ? Math.round((r.scoreSum / r.total) * 10) / 10 : 0,
              perfect_count: r.perfectCount,
              perfect_rate: r.total > 0 ? Math.round((r.perfectCount / r.total) * 100) : 0,
              total_xp: r.xpSum,
            }
          })

        setStats(statsArr)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAdmin])

  if (isChecking || isUserLoading) return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  )

  if (!isAdmin) return <div className="p-10 text-center font-black">접근 권한이 없습니다. 👮‍♂️</div>

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 font-sans">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-slate-100 z-10 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-[16px] font-black text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-500" /> 퀴즈 이력
        </span>
      </div>

      <main className="max-w-md mx-auto px-5 py-6 space-y-4">
        {isLoading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : stats.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-slate-300">
            <History className="w-10 h-10 opacity-20 mb-3" />
            <p className="text-[13px] font-bold">등록된 퀴즈가 없습니다</p>
          </div>
        ) : (
          stats.map((s) => (
            <div key={s.week_label} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
              {/* 주차 헤더 */}
              <button
                onClick={() => setExpandedWeek(expandedWeek === s.week_label ? null : s.week_label)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-black text-slate-800">{s.week_label}</p>
                    <p className="text-[11px] font-bold text-slate-400">{s.quizzes.length}개 문제</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400">{expandedWeek === s.week_label ? "▲" : "▼"}</span>
              </button>

              {/* 통계 요약 */}
              <div className="px-5 pb-4 grid grid-cols-3 gap-2">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center justify-center gap-0.5">
                    <Users className="w-3 h-3" /> 참여자
                  </p>
                  <p className="text-[15px] font-black text-slate-700">{s.total_participants.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3" /> 평균점수
                  </p>
                  <p className="text-[15px] font-black text-slate-700">{s.avg_score}<span className="text-[10px] text-slate-400"> /4</span></p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-amber-500 mb-1">올클 비율</p>
                  <p className="text-[15px] font-black text-amber-600">{s.perfect_rate}<span className="text-[10px]">%</span></p>
                </div>
              </div>

              {/* XP 배포 */}
              {s.total_participants > 0 && (
                <div className="px-5 pb-4">
                  <div className="bg-emerald-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700">총 배포 XP</span>
                    <span className="text-[13px] font-black text-emerald-600">+{s.total_xp.toLocaleString()} XP</span>
                  </div>
                </div>
              )}

              {/* 문제 상세 펼치기 */}
              {expandedWeek === s.week_label && (
                <div className="border-t border-slate-100 p-5 space-y-4 animate-in fade-in duration-200">
                  {s.quizzes.map((q, idx) => (
                    <div key={q.id} className="space-y-2">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit ${CATEGORY_THEMES[idx % 4].bg}`}>
                        <span>{CATEGORY_THEMES[idx % 4].icon}</span>
                        <span className={`text-[11px] font-black ${CATEGORY_THEMES[idx % 4].color}`}>
                          {CATEGORY_THEMES[idx % 4].label}
                        </span>
                      </div>
                      <p className="text-[13px] font-bold text-slate-800 leading-snug">{q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold ${
                              oIdx === q.answer_index
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-slate-50 text-slate-500"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                              oIdx === q.answer_index ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                            }`}>
                              {oIdx + 1}
                            </span>
                            {opt}
                            {oIdx === q.answer_index && <span className="ml-auto text-[9px] font-black text-emerald-500">정답</span>}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-[11px] font-bold text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  )
}
