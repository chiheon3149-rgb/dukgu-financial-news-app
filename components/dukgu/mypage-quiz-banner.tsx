"use client"

import { useState, useCallback } from "react"
import { Zap, CheckCircle, XCircle, Lightbulb, Trophy, Lock } from "lucide-react"
import {
  useWeeklyQuiz,
  QUIZ_CATEGORIES,
  XP_PER_CORRECT,
  BONUS_XP,
  type QuizCategory,
} from "@/hooks/use-weekly-quiz"

// =============================================================================
// 🎮 MyPageQuizBanner
//
// 마이페이지의 레벨 로드맵 위에 삽입되는 인라인 퀴즈 위젯입니다.
// 전체 페이지 이동 없이 마이페이지 안에서 바로 풀 수 있습니다.
//
// 상태 흐름:
//   "idle"   → 카테고리 선택 화면 (4개 카드)
//   "quiz"   → 선택한 카테고리의 문제 풀기
//   "result" → 정답/오답 결과 + XP 획득 표시
// =============================================================================

type PanelState = "idle" | "quiz" | "result"

export function MyPageQuizBanner() {
  const { weekKey, results, correctCount, isAllClear, getQuestion, submitAnswer } =
    useWeeklyQuiz()

  const [panel, setPanel] = useState<PanelState>("idle")
  const [activeCat, setActiveCat] = useState<QuizCategory | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [lastResult, setLastResult] = useState<{
    correct: boolean
    leveledUp: boolean
    earnedXp: number
  } | null>(null)

  const handleSelectCat = useCallback((cat: QuizCategory) => {
    if (results[cat]?.solved) return
    setActiveCat(cat)
    setSelectedIdx(null)
    setShowHint(false)
    setPanel("quiz")
  }, [results])

  const handleSubmit = useCallback(() => {
    if (!activeCat || selectedIdx === null) return
    const { correct, leveledUp } = submitAnswer(activeCat, selectedIdx)

    // 올클리어 보너스: 마지막 문제 정답 시 correctCount가 3→4가 되므로 보너스 포함
    const willBeAllClear = correct && correctCount + 1 === QUIZ_CATEGORIES.length
    const earnedXp = correct ? XP_PER_CORRECT + (willBeAllClear ? BONUS_XP : 0) : 0

    setLastResult({ correct, leveledUp, earnedXp })
    setPanel("result")
  }, [activeCat, selectedIdx, submitAnswer, correctCount])

  const handleBackToIdle = useCallback(() => {
    setPanel("idle")
    setActiveCat(null)
    setLastResult(null)
  }, [])

  const meta = activeCat ? QUIZ_CATEGORIES.find((c) => c.id === activeCat)! : null
  const question = activeCat ? getQuestion(activeCat) : null

  // 진행률 계산
  const totalCats = QUIZ_CATEGORIES.length
  const progressPct = Math.round((correctCount / totalCats) * 100)

  return (
    <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
      {/* ── 헤더: 항상 표시 ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎮</span>
            <div>
              <p className="text-[13px] font-black text-slate-800">이번 주 상식 퀴즈</p>
              <p className="text-[10px] font-bold text-slate-400">{weekKey} · 문제당 {XP_PER_CORRECT}XP</p>
            </div>
          </div>

          {/* 진행 뱃지 */}
          {isAllClear ? (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Trophy className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600">올클리어!</span>
            </div>
          ) : (
            <span className="text-[11px] font-black text-slate-500">
              {correctCount}/{totalCats} 정답
            </span>
          )}
        </div>

        {/* 진행 바 */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {QUIZ_CATEGORIES.map((cat) => {
            const r = results[cat.id]
            return (
              <span key={cat.id} className="text-[9px] font-bold text-slate-400">
                {r?.solved ? (r.correct ? "✅" : "❌") : cat.icon}
              </span>
            )
          })}
        </div>
      </div>

      {/* ── 패널 1: 카테고리 선택 ── */}
      {panel === "idle" && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-2.5">
            {QUIZ_CATEGORIES.map((cat) => {
              const r = results[cat.id]
              const solved = r?.solved ?? false
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCat(cat.id)}
                  disabled={solved}
                  className={`relative flex flex-col items-start gap-1.5 p-4 rounded-2xl border text-left transition-all active:scale-95
                    ${solved
                      ? "bg-slate-50 border-slate-100 opacity-70 cursor-not-allowed"
                      : `bg-gradient-to-br ${cat.color} border-white/20 hover:scale-[1.02] shadow-sm`
                    }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className={`text-[13px] font-black ${solved ? "text-slate-500" : "text-white drop-shadow-sm"}`}>
                    {cat.title}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    solved
                      ? r?.correct
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-rose-100 text-rose-500"
                      : "bg-white/20 text-white"
                  }`}>
                    {solved
                      ? r?.correct ? `+${XP_PER_CORRECT}XP 획득` : "오답"
                      : `+${XP_PER_CORRECT}XP`}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 올클리어 보너스 안내 */}
          <div className={`mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border text-[10px] font-black transition-all ${
            isAllClear
              ? "bg-amber-50 border-amber-200 text-amber-600"
              : "bg-slate-50 border-slate-100 text-slate-400"
          }`}>
            <Trophy className="w-3 h-3" />
            4문제 올클리어 보너스 +{BONUS_XP}XP
            {isAllClear && " 획득!"}
          </div>
        </div>
      )}

      {/* ── 패널 2: 문제 풀기 ── */}
      {panel === "quiz" && meta && question && (
        <div className="px-5 pb-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* 문제 카드 */}
          <div className={`bg-gradient-to-br ${meta.color} rounded-2xl p-4 mb-4 border border-white/20`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black bg-black/20 text-white px-2 py-0.5 rounded-full">
                {meta.icon} {meta.title}
              </span>
              <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3 text-amber-300" />
                <span className="text-[10px] font-black text-amber-200">+{meta.xp}XP</span>
              </div>
            </div>
            <p className="text-[14px] font-black text-white leading-snug drop-shadow-sm">
              {question.q}
            </p>
          </div>

          {/* 선택지 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`p-3 rounded-xl border-2 text-[13px] font-bold text-left transition-all active:scale-95 ${
                  selectedIdx === idx
                    ? "bg-slate-800 text-white border-slate-800 shadow-lg"
                    : "bg-slate-50 text-slate-700 border-slate-100 hover:border-slate-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* 힌트 */}
          <button
            onClick={() => setShowHint((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-amber-500 transition-colors mb-2"
          >
            <Lightbulb className="w-3 h-3" /> 힌트 보기
          </button>
          {showHint && (
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-[11px] font-bold text-amber-700 animate-in fade-in">
              💡 {question.hint}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleBackToIdle}
              className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-[12px] font-black transition-all active:scale-95"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedIdx === null}
              className={`flex-[2] py-3 rounded-xl text-[12px] font-black transition-all active:scale-95 ${
                selectedIdx !== null
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              제출하기
            </button>
          </div>
        </div>
      )}

      {/* ── 패널 3: 결과 ── */}
      {panel === "result" && lastResult && meta && (
        <div className="px-5 pb-5 text-center animate-in zoom-in-95 duration-300">
          <div className="py-4">
            {lastResult.correct ? (
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            ) : (
              <XCircle className="w-12 h-12 text-rose-400 mx-auto mb-2" />
            )}

            <p className="text-[17px] font-black text-slate-800 mb-1">
              {lastResult.correct ? "정답입니다! 🎉" : "아쉽네요 😢"}
            </p>

            {lastResult.correct && (
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-[12px] font-black text-amber-600">
                    +{lastResult.earnedXp}XP 획득
                  </span>
                </div>
                {lastResult.leveledUp && (
                  <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full animate-in zoom-in">
                    <span className="text-[12px] font-black text-emerald-600">🎊 레벨업!</span>
                  </div>
                )}
              </div>
            )}

            {/* 올클리어 달성 메시지 */}
            {isAllClear && (
              <div className="mt-2 py-2 px-4 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-100 rounded-2xl">
                <p className="text-[11px] font-black text-amber-600">
                  🏆 이번 주 퀴즈 올클리어! 보너스 +{BONUS_XP}XP 지급 완료
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleBackToIdle}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[12px] font-black transition-all active:scale-95"
          >
            목록으로 돌아가기
          </button>
        </div>
      )}
    </section>
  )
}
