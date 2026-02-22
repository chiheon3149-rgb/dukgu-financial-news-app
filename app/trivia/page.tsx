"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lightbulb, Trophy, AlertCircle, Sparkles, Bone, Zap, CheckCircle, XCircle, Lock } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { XpLevelBadge } from "@/components/dukgu/xp-level-badge"
import { useUserProfile } from "@/hooks/use-user-profile"
import {
  useWeeklyQuiz,
  QUIZ_CATEGORIES,
  XP_PER_CORRECT,
  BONUS_XP,
  type QuizCategory,
} from "@/hooks/use-weekly-quiz"

// =============================================================================
// 🎮 /trivia — 덕구 상식 퀴즈 (전체 페이지 버전)
//
// 마이페이지 인라인 배너(MyPageQuizBanner)와 동일한 useWeeklyQuiz 훅을 공유합니다.
// 한 쪽에서 풀면 다른 쪽에도 결과가 반영됩니다 (localStorage 동기화).
// =============================================================================

type Step = "select" | "quiz" | "result"

export default function TriviaPage() {
  const router = useRouter()
  const { profile, currentLevel, nextLevel, levelProgress } = useUserProfile()
  const { weekKey, results, correctCount, isAllClear, getQuestion, submitAnswer } = useWeeklyQuiz()

  const [step, setStep] = useState<Step>("select")
  const [activeCat, setActiveCat] = useState<QuizCategory | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; leveledUp: boolean; earnedXp: number } | null>(null)

  // 페이지 포커스 시 최신 결과 반영 (마이페이지 배너에서 풀고 돌아온 경우)
  useEffect(() => {
    // results는 useState + localStorage로 관리되므로 자동 반영됩니다
  }, [])

  const handleSelect = (cat: QuizCategory) => {
    if (results[cat]?.solved) return
    setActiveCat(cat)
    setSelectedIdx(null)
    setShowHint(false)
    setStep("quiz")
  }

  const handleSubmit = () => {
    if (!activeCat || selectedIdx === null) return
    const { correct, leveledUp } = submitAnswer(activeCat, selectedIdx)
    const willBeAllClear = correct && correctCount + 1 === QUIZ_CATEGORIES.length
    const earnedXp = correct ? XP_PER_CORRECT + (willBeAllClear ? BONUS_XP : 0) : 0
    setLastResult({ correct, leveledUp, earnedXp })
    setStep("result")
  }

  const meta = activeCat ? QUIZ_CATEGORIES.find((c) => c.id === activeCat)! : null
  const question = activeCat ? getQuestion(activeCat) : null

  return (
    <div className="min-h-dvh bg-[url('https://i.ifh.cc/GGjN8Q.webp')] bg-cover bg-center bg-fixed pb-20 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />

      <DetailHeader
        title="덕구의 상식 퀴즈"
        isDark
        rightElement={<Bone className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />}
        onBack={() => {
          if (step === "select") router.push("/")
          else setStep("select")
        }}
      />

      <main className="container max-w-md mx-auto px-4 py-6 relative z-10 space-y-3">
        {/* 현재 XP / 레벨 */}
        {profile && (
          <div className="bg-white/15 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/20">
            <XpLevelBadge
              currentLevel={currentLevel}
              nextLevel={nextLevel}
              totalXp={profile.totalXp}
              progress={levelProgress}
              size="sm"
            />
          </div>
        )}

        {/* 주차 진행률 */}
        <div className="bg-white/15 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {QUIZ_CATEGORIES.map((cat) => {
              const r = results[cat.id]
              return (
                <span key={cat.id} className="text-lg">
                  {r?.solved ? (r.correct ? "✅" : "❌") : cat.icon}
                </span>
              )
            })}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white/70">{weekKey}</p>
            <p className="text-[11px] font-black text-white">
              {correctCount}/{QUIZ_CATEGORIES.length} 정답
              {isAllClear && " 🏆"}
            </p>
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl">

          {/* ── 분야 선택 ── */}
          {step === "select" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-sm font-medium text-white/90 mb-1 drop-shadow-sm">
                정답을 맞추고 경험치를 쌓으세요!
              </p>
              <h2 className="text-2xl font-extrabold text-white mb-2 drop-shadow-md flex items-center gap-2">
                주간 퀴즈 도전 🐾
              </h2>
              <p className="text-[11px] font-bold text-white/60 mb-5">
                ✨ 문제당 {XP_PER_CORRECT}XP · 올클리어 보너스 +{BONUS_XP}XP
              </p>

              <div className="grid grid-cols-2 gap-3">
                {QUIZ_CATEGORIES.map((cat) => {
                  const r = results[cat.id]
                  const solved = r?.solved ?? false
                  return (
                    <button
                      key={cat.id}
                      onClick={() => !solved && handleSelect(cat.id)}
                      disabled={solved}
                      className={`relative overflow-hidden p-4 rounded-2xl border border-white/30 text-left h-36 flex flex-col justify-between transition-all duration-300
                        ${solved
                          ? "bg-black/30 cursor-not-allowed"
                          : `bg-gradient-to-br ${cat.color} hover:scale-105 shadow-md`}`}
                    >
                      <div>
                        <span className="text-3xl mb-1 block drop-shadow-md">{cat.icon}</span>
                        <h3 className="text-white font-bold text-base drop-shadow-md leading-tight">
                          {cat.title} 영역
                        </h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-white/15 px-2 py-1 rounded-full">
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span className="text-[9px] font-black text-amber-200">+{cat.xp}XP</span>
                        </div>
                        {solved ? (
                          <div className={`p-1 rounded-full ${r?.correct ? "bg-emerald-500" : "bg-rose-500"}`}>
                            {r?.correct
                              ? <CheckCircle className="w-3 h-3 text-white" />
                              : <XCircle className="w-3 h-3 text-white" />}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 올클리어 보너스 배너 */}
              <div className={`mt-4 flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-[11px] font-black transition-all ${
                isAllClear
                  ? "bg-amber-400/20 border-amber-400/30 text-amber-200"
                  : "bg-white/10 border-white/10 text-white/50"
              }`}>
                <Trophy className="w-3.5 h-3.5" />
                4문제 올클리어 달성 시 보너스 +{BONUS_XP}XP
              </div>
            </div>
          )}

          {/* ── 문제 풀기 ── */}
          {step === "quiz" && meta && question && (
            <div className="animate-in fade-in zoom-in-95 duration-400 text-white">
              <div className={`rounded-2xl bg-gradient-to-br ${meta.color} p-5 mb-5 border border-white/20`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold bg-black/20 px-2 py-1 rounded border border-white/10">
                    {meta.icon} {meta.title}
                  </span>
                  <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span className="text-[10px] font-black text-amber-200">+{meta.xp}XP</span>
                  </div>
                </div>
                <p className="text-[15px] font-bold leading-snug drop-shadow-md">{question.q}</p>
              </div>

              <div className="flex flex-col gap-2.5 mb-6">
                {question.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIdx(idx)}
                    className={`p-4 rounded-xl border-2 font-bold text-left transition-all active:scale-95 ${
                      selectedIdx === idx
                        ? "bg-white text-slate-800 border-white shadow-lg"
                        : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={selectedIdx === null}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl mb-3 ${
                  selectedIdx !== null
                    ? "bg-white text-slate-900 scale-[1.02]"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                답안 제출하기
              </button>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setShowHint((v) => !v)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-white/60 hover:text-white bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> 힌트 보기
                </button>
                {showHint && (
                  <div className="p-4 bg-amber-100/90 backdrop-blur-md border border-amber-300 rounded-xl text-xs font-bold text-amber-900 animate-in fade-in w-full text-center">
                    💡 {question.hint}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 결과 ── */}
          {step === "result" && lastResult && (
            <div className="flex flex-col items-center py-8 text-white text-center animate-in zoom-in-95">
              {lastResult.correct ? (
                <div className="relative">
                  <Trophy className="w-20 h-20 text-yellow-300 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]" />
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-200 animate-pulse" />
                </div>
              ) : (
                <AlertCircle className="w-20 h-20 text-rose-400 mb-4" />
              )}

              <h2 className="text-3xl font-black mb-2 drop-shadow-md">
                {lastResult.correct ? "정답입니다!" : "아쉽네요!"}
              </h2>

              {lastResult.correct && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 px-4 py-2 rounded-full">
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span className="text-[13px] font-black text-amber-200">+{lastResult.earnedXp}XP 획득!</span>
                  </div>
                  {lastResult.leveledUp && (
                    <div className="flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-400/30 px-4 py-2 rounded-full animate-in zoom-in">
                      <span className="text-[13px] font-black text-emerald-200">🎉 레벨업!</span>
                    </div>
                  )}
                </div>
              )}

              {isAllClear && (
                <div className="mb-6 py-2.5 px-5 bg-amber-400/20 border border-amber-400/30 rounded-2xl">
                  <p className="text-[12px] font-black text-amber-200">
                    🏆 이번 주 올클리어! 보너스 +{BONUS_XP}XP 지급 완료
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep("select")}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold border border-white/20 transition-all active:scale-95"
              >
                다른 분야 도전하기
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
