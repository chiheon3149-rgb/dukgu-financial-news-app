"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Zap, CheckCircle, XCircle, Lightbulb, Trophy, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

// 퀴즈 설정값
const XP_PER_CORRECT = 5
const BONUS_XP = 10

// 카테고리 정의 (기획자님의 디자인 기준)
const QUIZ_CATEGORIES = [
  { id: "economy", title: "경제상식", icon: "📈", color: "from-blue-500 to-blue-600", xp: 5 },
  { id: "stock", title: "주식/투자", icon: "💰", color: "from-emerald-500 to-emerald-600", xp: 5 },
  { id: "realestate", title: "부동산", icon: "🏠", color: "from-orange-500 to-orange-600", xp: 5 },
  { id: "trend", title: "금융트렌드", icon: "🔥", color: "from-purple-500 to-purple-600", xp: 5 },
]

type PanelState = "idle" | "quiz" | "result"

export function MyPageQuizBanner() {
  const router = useRouter()
  const { profile } = useUser()

  // 데이터 상태
  const [loading, setLoading] = useState(true)
  const [weekLabel, setWeekLabel] = useState("")
  const [dbQuizzes, setDbQuizzes] = useState<any[]>([])
  const [results, setResults] = useState<Record<string, { solved: boolean; correct: boolean }>>({})

  // UI 상태
  const [panel, setPanel] = useState<PanelState>("idle")
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; earnedXp: number } | null>(null)

  // 1️⃣ 초기 데이터 로드 (이번 주 문제 + 유저가 푼 내역)
  useEffect(() => {
    const initQuiz = async () => {
      if (!profile?.id) return
      try {
        // 최신 퀴즈 가져오기
        const { data: qData } = await supabase
          .from("quizzes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4)

        if (qData && qData.length > 0) {
          setDbQuizzes(qData)
          setWeekLabel(qData[0].week_label)

          // 유저가 이미 풀었는지 확인
          const { data: resData } = await supabase
            .from("quiz_results")
            .select("*")
            .eq("user_id", profile.id)
            .eq("week_label", qData[0].week_label)
            .single()

          if (resData) {
            // 이미 푼 경우 결과 UI 처리 (단순화 예시)
            const mockResults: any = {}
            QUIZ_CATEGORIES.forEach((cat, idx) => {
              mockResults[cat.id] = { solved: true, correct: true } // 실제론 세부 정답여부 저장 필요
            })
            // setResults(mockResults) // 필요시 활성화
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    initQuiz()
  }, [profile?.id])

  // 2️⃣ 정답 처리 및 보상 지급
  const handleSubmit = async () => {
    if (activeIdx === null || selectedIdx === null || !profile?.id) return

    const currentQuiz = dbQuizzes[activeIdx]
    const isCorrect = currentQuiz.answer_index === selectedIdx
    const catId = QUIZ_CATEGORIES[activeIdx].id

    // 결과 로컬 업데이트
    setResults(prev => ({ ...prev, [catId]: { solved: true, correct: isCorrect } }))
    
    // XP 계산 (맞으면 5XP)
    const earnedXp = isCorrect ? XP_PER_CORRECT : 0
    
    // 만약 이게 마지막 4번째 문제라면 '전체 제출' 처리 및 보너스 지급 가능 (생략 가능)
    setLastResult({ correct: isCorrect, earnedXp })
    setPanel("result")

    // DB 경험치 업데이트 (실시간 반영)
    if (earnedXp > 0) {
      await supabase.rpc('increment_user_xp', { u_id: profile.id, x: earnedXp })
    }
  }

  const handleSelectCat = (idx: number) => {
    const catId = QUIZ_CATEGORIES[idx].id
    if (results[catId]?.solved || !dbQuizzes[idx]) return
    setActiveIdx(idx)
    setSelectedIdx(null)
    setShowHint(false)
    setPanel("quiz")
  }

  // 계산된 정보
  const correctCount = useMemo(() => Object.values(results).filter(r => r.correct).length, [results])
  const isAllClear = correctCount === 4
  const progressPct = (Object.keys(results).length / 4) * 100

  if (loading) return <div className="h-48 bg-slate-50 animate-pulse rounded-[28px]" />

  return (
    <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden font-sans">
      {/* ── 헤더 ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎮</span>
            <div>
              <p className="text-[13px] font-black text-slate-800">이번 주 상식 퀴즈</p>
              <p className="text-[10px] font-bold text-slate-400">{weekLabel} · {XP_PER_CORRECT}XP씩 획득</p>
            </div>
          </div>
          {isAllClear ? (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Trophy className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600">올클리어!</span>
            </div>
          ) : (
            <span className="text-[11px] font-black text-slate-500">{correctCount}/4 정답</span>
          )}
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── 패널 1: 선택 (Idle) ── */}
      {panel === "idle" && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-2.5">
            {QUIZ_CATEGORIES.map((cat, idx) => {
              const r = results[cat.id]
              const solved = r?.solved
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCat(idx)}
                  disabled={solved}
                  className={`relative flex flex-col items-start gap-1.5 p-4 rounded-2xl border text-left transition-all active:scale-95
                    ${solved
                      ? "bg-slate-50 border-slate-100 opacity-60"
                      : `bg-gradient-to-br ${cat.color} border-white/20 shadow-sm`
                    }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className={`text-[13px] font-black ${solved ? "text-slate-400" : "text-white"}`}>
                    {cat.title}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    solved ? "bg-slate-200 text-slate-500" : "bg-white/20 text-white"
                  }`}>
                    {solved ? (r.correct ? "성공" : "오답") : `+${cat.xp}XP`}
                  </span>
                </button>
              )
            })}
          </div>
          {isAllClear && (
            <div className="mt-3 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-[10px] font-black text-amber-600 flex items-center justify-center gap-1.5">
              <Trophy className="w-3 h-3" /> 보너스 +{BONUS_XP}XP 획득 완료!
            </div>
          )}
        </div>
      )}

      {/* ── 패널 2: 문제 풀기 (Quiz) ── */}
      {panel === "quiz" && activeIdx !== null && (
        <div className="px-5 pb-5 animate-in fade-in slide-in-from-bottom-2">
          <div className={`bg-gradient-to-br ${QUIZ_CATEGORIES[activeIdx].color} rounded-2xl p-4 mb-4`}>
            <p className="text-[14px] font-black text-white leading-snug">
              {dbQuizzes[activeIdx].question}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {dbQuizzes[activeIdx].options.map((opt: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`p-3 rounded-xl border-2 text-[13px] font-bold text-left transition-all ${
                  selectedIdx === idx ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 border-slate-100"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setPanel("idle")} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-[12px] font-black">취소</button>
            <button 
              onClick={handleSubmit} 
              disabled={selectedIdx === null}
              className="flex-[2] py-3 bg-emerald-500 text-white rounded-xl text-[12px] font-black disabled:bg-slate-200"
            >
              제출하기
            </button>
          </div>
        </div>
      )}

      {/* ── 패널 3: 결과 (Result) ── */}
      {panel === "result" && lastResult && (
        <div className="px-5 pb-5 text-center animate-in zoom-in-95">
          <div className="py-4">
            {lastResult.correct ? (
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            ) : (
              <XCircle className="w-12 h-12 text-rose-400 mx-auto mb-2" />
            )}
            <p className="text-[17px] font-black text-slate-800">
              {lastResult.correct ? `+${lastResult.earnedXp}XP 획득! 🎉` : "아쉬워요, 다음 기회에! 😢"}
            </p>
          </div>
          <button onClick={() => setPanel("idle")} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-[12px] font-black">
            다른 문제 풀기
          </button>
        </div>
      )}
    </section>
  )
}