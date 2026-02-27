"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, CheckCircle2, Trophy, 
  Lightbulb, Loader2, Sparkles, Zap, Gift
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

// 🎨 카테고리 테마 (Tailwind 깨짐 방지용 고정 HEX 스타일)
const CATEGORY_THEMES = [
  { id: 0, label: "경제상식", icon: "📈", gradient: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)", bg: "#eff6ff" },
  { id: 1, label: "주식/투자", icon: "💰", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)", bg: "#ecfdf5" },
  { id: 2, label: "부동산", icon: "🏠", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", bg: "#fff7ed" },
  { id: 3, label: "금융트렌드", icon: "🔥", gradient: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", bg: "#faf5ff" },
]

const XP_PER_QUESTION = 10; 
const BONUS_XP = 10;

export default function QuizPage() {
  const router = useRouter()
  const { profile, fetchProfile } = useUser()

  const [quizzes, setQuizzes] = useState<any[]>([])
  const [weekLabel, setWeekLabel] = useState("")
  const [loading, setLoading] = useState(true)
  const [isAlreadySolved, setIsAlreadySolved] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  
  // 💡 [실시간 점수용 핵심 상태] 낙관적 UI 적용
  const [displayXp, setDisplayXp] = useState(0)

  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  
  // 💡 진행 중인 결과를 담는 상태 (DB와 연동)
  const [results, setResults] = useState<Record<number, { solved: boolean; correct: boolean }>>({})

  // 0️⃣ 유저 프로필이 로드되면 화면용 점수(displayXp) 초기화
  useEffect(() => {
    if (profile?.total_xp !== undefined) {
      setDisplayXp(profile.total_xp)
    }
  }, [profile?.total_xp])

  // 1️⃣ 초기 데이터 로드: 퀴즈 + 이어풀기 기록(quiz_progress) 불러오기
  useEffect(() => {
    const initPage = async () => {
      if (!profile?.id) return
      try {
        // A. 이번 주 퀴즈 로드
        const { data: quizData } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false }).limit(4)
        if (!quizData || quizData.length === 0) return
        
        const currentWeek = quizData[0].week_label
        setQuizzes(quizData); setWeekLabel(currentWeek)

        // B. 이미 최종 완료(보너스까지 수령)했는지 확인
        const { data: existingFinal } = await supabase.from("quiz_results").select("id").eq("user_id", profile.id).eq("week_label", currentWeek).single()
        if (existingFinal) {
          setIsAlreadySolved(true)
          setLoading(false)
          return
        }

        // C. [이어풀기] 중간에 풀었던 진행 내역 가져오기
        const { data: progressData } = await supabase.from("quiz_progress").select("quiz_idx, is_correct").eq("user_id", profile.id).eq("week_label", currentWeek)
        
        if (progressData) {
          const loadedResults: Record<number, { solved: boolean; correct: boolean }> = {}
          progressData.forEach(p => {
            loadedResults[p.quiz_idx] = { solved: true, correct: p.is_correct }
          })
          setResults(loadedResults)
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    initPage()
  }, [profile?.id])

  // 2️⃣ 정답 제출 (실시간 저장 + 점수 즉시 반영)
  const handleAnswerSubmit = async () => {
    if (activeIdx === null || selectedOpt === null || !profile?.id) return
    
    const isCorrect = quizzes[activeIdx].answer_index === selectedOpt
    
    try {
      // A. [실시간 저장] 하나 풀 때마다 progress 테이블에 기록 (뒤로가기 대비)
      await supabase.from("quiz_progress").upsert({
        user_id: profile.id,
        week_label: weekLabel,
        quiz_idx: activeIdx,
        is_correct: isCorrect
      })

      // B. 결과 반영
      const newResults = { ...results, [activeIdx]: { solved: true, correct: isCorrect } }
      setResults(newResults)

      // C. 점수 지급 및 프로필 동기화
      if (isCorrect) {
        // 💡 화면 점수 즉시 반영 (낙관적 업데이트)
        setDisplayXp(prev => prev + XP_PER_QUESTION)
        
        await supabase.rpc('increment_user_xp', { u_id: profile.id, x: XP_PER_QUESTION })
        if (fetchProfile) fetchProfile() // 백그라운드 갱신
        toast.success(`정답! +${XP_PER_QUESTION}XP 획득 ✨`)
      } else {
        toast.error("오답입니다 😢")
      }

      // 4문제를 다 풀었는데 올클리어가 아닌 경우(중간에 틀림) 즉시 성적표 마감
      const solvedCount = Object.keys(newResults).length
      const correctCount = Object.values(newResults).filter(r => r.correct).length
      if (solvedCount === 4 && correctCount < 4) {
        await finalizeQuiz(correctCount)
      }
    } catch (e) {
      toast.error("저장 중 오류가 발생했습니다.")
    }

    setActiveIdx(null); setSelectedOpt(null); setShowHint(false)
  }

  // 3️⃣ 보너스 버튼 클릭 (최종 10XP 추가 지급)
  const handleClaimBonus = async () => {
    if (!profile?.id || isClaiming) return
    setIsClaiming(true)
    try {
      // 💡 화면 점수 보너스 즉시 반영
      setDisplayXp(prev => prev + BONUS_XP)
      
      await supabase.rpc('increment_user_xp', { u_id: profile.id, x: BONUS_XP })
      if (fetchProfile) fetchProfile() 
      
      await finalizeQuiz(4, (4 * XP_PER_QUESTION) + BONUS_XP)
      toast.success("보너스 10XP까지 획득 완료! 🏆")
    } catch (e) { toast.error("보상 수령 실패") } finally { setIsClaiming(false) }
  }

  // 공통 마감 로직
  const finalizeQuiz = async (score: number, totalXpEarned?: number) => {
    await supabase.from("quiz_results").insert({
      user_id: profile?.id, week_label: weekLabel, score: score, xp_earned: totalXpEarned || score * XP_PER_QUESTION
    })
    setIsAlreadySolved(true)
  }

  const solvedCount = Object.keys(results).length
  const correctCount = Object.values(results).filter(r => r.correct).length
  const canClaimBonus = solvedCount === 4 && correctCount === 4 && !isAlreadySolved

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-500" /></div>

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 font-sans text-slate-900">
      {/* ── 상단바: 실시간 displayXp 표시 ── */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
          <span className="text-[16px] font-black">이번 주 미션</span>
        </div>
        
        {/* 💡 실시간으로 변하는 displayXp 사용 */}
        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
          <span className="text-[12px] font-black text-emerald-600">
            {displayXp.toLocaleString()} XP
          </span>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 py-6">
        <section className="mb-8 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] font-black text-slate-400 mb-1">{weekLabel}</p>
              <h2 className="text-[20px] font-black">
                {isAlreadySolved ? "미션 완료! 🏆" : "금융 상식 도전하기"}
              </h2>
            </div>
            <span className="text-[14px] font-black text-emerald-500">{isAlreadySolved ? 4 : solvedCount}/4</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000" 
              style={{ width: `${isAlreadySolved ? 100 : (solvedCount / 4) * 100}%` }} 
            />
          </div>
        </section>

        {activeIdx === null ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {CATEGORY_THEMES.map((theme, idx) => {
                const res = results[idx] || (isAlreadySolved ? { solved: true, correct: true } : null)
                return (
                  <button
                    key={idx}
                    onClick={() => !res?.solved && setActiveIdx(idx)}
                    className="relative aspect-[4/5] rounded-[32px] p-5 text-left transition-all active:scale-95 shadow-sm overflow-hidden"
                    style={{ background: res?.solved ? "#ffffff" : theme.gradient, border: res?.solved ? "1px solid #f1f5f9" : "none" }}
                  >
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <span className="text-3xl">{theme.icon}</span>
                      <div>
                        <p className={`text-[14px] font-black mb-1 ${res?.solved ? "text-slate-800" : "text-white"}`}>{theme.label}</p>
                        <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-white text-[9px] font-bold">
                          {res?.solved ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Sparkles className="w-2.5 h-2.5" />}
                          <span className={res?.solved ? "text-emerald-500" : "text-white"}>{res?.solved ? "완료" : "+10XP"}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 🏆 [수리 완료] 절대 안 깨지는 황금 보너스 버튼 */}
            {canClaimBonus && (
              <div className="animate-in fade-in zoom-in-95 pt-2">
                <button 
                  onClick={handleClaimBonus}
                  disabled={isClaiming}
                  className="w-full py-7 rounded-[32px] flex flex-col items-center gap-2 group active:scale-[0.98] transition-all shadow-xl shadow-orange-100"
                  style={{ background: "linear-gradient(90deg, #fbbf24 0%, #f97316 100%)" }}
                >
                  <Gift className="w-10 h-10 text-white" />
                  <div className="text-center font-black">
                    <p className="text-white text-[20px]">올클리어 보너스 받기</p>
                    <p className="text-white/80 text-[12px]">눌러서 추가 10XP를 받으세요! ✨</p>
                  </div>
                </button>
              </div>
            )}
            
            {isAlreadySolved && (
              <div className="bg-white border border-slate-100 rounded-[32px] p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center"><Trophy className="w-6 h-6 text-amber-500" /></div>
                  <div><p className="text-[14px] font-black">이번 주 미션 성공</p><p className="text-[11px] font-bold text-slate-400">다음 주에 새로운 퀴즈가 찾아옵니다!</p></div>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            )}
          </div>
        ) : (
          /* 문제 풀이 화면 (힌트 가독성 수리) */
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="rounded-[32px] p-6 mb-6 shadow-sm border border-slate-100" style={{ backgroundColor: CATEGORY_THEMES[activeIdx].bg }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{CATEGORY_THEMES[activeIdx].icon}</span>
                <span className="text-[11px] font-black text-slate-400 uppercase">{CATEGORY_THEMES[activeIdx].label}</span>
              </div>
              <h3 className="text-[18px] font-black leading-snug">{quizzes[activeIdx].question}</h3>
            </div>

            <div className="space-y-3 mb-6">
              {quizzes[activeIdx].options.map((opt: string, i: number) => (
                <button key={i} onClick={() => setSelectedOpt(i)} className={`w-full p-5 rounded-2xl border-2 text-left font-bold transition-all ${selectedOpt === i ? "border-slate-800 bg-slate-800 text-white shadow-lg" : "border-white bg-white text-slate-600"}`}>
                  <span className={`mr-2 ${selectedOpt === i ? "text-emerald-400" : "text-slate-300"}`}>{i + 1}.</span>{opt}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {/* 힌트 버튼 */}
              <button 
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 text-[12px] font-black px-2 transition-all"
                style={{ color: showHint ? "#f59e0b" : "#94a3b8" }}
              >
                <Lightbulb className={`w-4 h-4 ${showHint ? "fill-amber-400" : ""}`} /> 힌트 보기
              </button>

              {showHint && (
                <div className="p-5 rounded-2xl border border-amber-100 text-[13px] font-bold text-amber-800 animate-in fade-in zoom-in-95" style={{ backgroundColor: "#fffbeb" }}>
                  💡 {quizzes[activeIdx].explanation || "힌트가 준비되지 않았습니다."}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setActiveIdx(null)} className="flex-1 py-4 bg-slate-200 text-slate-500 rounded-2xl font-black active:scale-95">닫기</button>
                <button 
                  onClick={handleAnswerSubmit} 
                  disabled={selectedOpt === null} 
                  className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 disabled:bg-slate-100 active:scale-95"
                >
                  정답 제출
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}