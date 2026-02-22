"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "@/context/user-context"

// =============================================================================
// 🎮 useWeeklyQuiz
//
// 설계 철학:
//   - 4개 카테고리(정치/경제/사회/문화)가 각각 주차별로 1문제씩 오픈됩니다.
//   - 문제당 10XP, 4문제 모두 정답이면 보너스 10XP (최대 50XP/주).
//   - 상태는 localStorage에 { [weekKey]: { [category]: { solved, correct } } }
//     형태로 저장됩니다. Supabase 전환 시 이 부분만 교체하면 됩니다.
//   - 주차(weekKey)는 "YYYY-Www" 형식으로 구분합니다 (예: "2026-W09").
//     이렇게 하면 다음 주가 되면 localStorage 키가 달라져서 자동으로 초기화됩니다.
// =============================================================================

export type QuizCategory = "politics" | "economy" | "society" | "culture"

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number // 정답 인덱스
  hint: string
}

export interface CategoryMeta {
  id: QuizCategory
  title: string
  icon: string
  color: string
  xp: number // 이 문제의 배점
}

/** 카테고리별 메타 정보 (UI 렌더링용) */
export const QUIZ_CATEGORIES: CategoryMeta[] = [
  { id: "politics", title: "정치", icon: "🏛️", color: "from-purple-500/80 to-indigo-600/80", xp: 10 },
  { id: "economy",  title: "경제", icon: "📈", color: "from-emerald-400/80 to-green-600/80",  xp: 10 },
  { id: "society",  title: "사회", icon: "🤝", color: "from-amber-400/80 to-orange-500/80",  xp: 10 },
  { id: "culture",  title: "문화", icon: "🎨", color: "from-pink-400/90 to-rose-500/90",     xp: 10 },
]

export const BONUS_XP = 10      // 4문제 올클리어 보너스
export const XP_PER_CORRECT = 10 // 문제당 XP

/**
 * 현재 날짜 기준 ISO 주차 키를 반환합니다.
 * 매주 월요일이 되면 새 키로 바뀌어 자동으로 퀴즈가 리셋됩니다.
 */
export function getCurrentWeekKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
  const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, "0")}`
}

/**
 * 주차별로 다른 문제 세트를 반환합니다.
 * 실제 서비스에서는 Supabase의 weekly_questions 테이블에서 불러옵니다.
 */
const ALL_QUESTIONS: Record<QuizCategory, QuizQuestion[]> = {
  politics: [
    { q: "대한민국 국회의원의 임기는?", options: ["2년", "3년", "4년", "5년"], answer: 2, hint: "올림픽 개최 주기와 같습니다." },
    { q: "대한민국 대통령의 임기는?", options: ["4년", "5년", "6년", "7년"], answer: 1, hint: "단임제로 운영됩니다." },
  ],
  economy: [
    { q: "콜옵션 매도로 배당 수익을 추구하는 ETF 전략은?", options: ["커버드콜", "숏셀링", "스트랭글", "스윙트레이딩"], answer: 0, hint: "최근 인기 있는 고배당 전략입니다." },
    { q: "중앙은행이 시중에 돈을 푸는 정책을 뜻하는 용어는?", options: ["긴축정책", "양적완화", "지급준비율", "기준금리"], answer: 1, hint: "QE라고도 불립니다." },
  ],
  society: [
    { q: "생산가능인구가 급감하는 현상을 뜻하는 용어는?", options: ["인구 데드크로스", "인구 오너스", "인구 절벽", "인구 지진"], answer: 2, hint: "낭떠러지처럼 뚝 떨어지는 현상입니다." },
    { q: "65세 이상 인구 비율이 20% 이상인 사회를 무엇이라 하나요?", options: ["고령화사회", "고령사회", "초고령사회", "노령사회"], answer: 2, hint: "UN 기준으로 가장 심각한 단계입니다." },
  ],
  culture: [
    { q: "한국 전통 가옥에서 방과 방 사이의 큰 마루를 뜻하는 말은?", options: ["대청", "툇마루", "사랑채", "안채"], answer: 0, hint: "여름에 시원한 넓은 마루입니다." },
    { q: "판소리에서 창을 부르는 사람을 무엇이라 하나요?", options: ["고수", "창부", "소리꾼", "광대"], answer: 2, hint: "소리를 담당하는 사람입니다." },
  ],
}

/** 주차 번호에 따라 문제 인덱스를 순환합니다 */
function getQuestionForWeek(category: QuizCategory, weekKey: string): QuizQuestion {
  const questions = ALL_QUESTIONS[category]
  // 주차 번호를 숫자로 파싱해서 문제 인덱스로 씁니다 (모듈러 연산으로 순환)
  const weekNum = parseInt(weekKey.split("-W")[1] ?? "1", 10)
  return questions[weekNum % questions.length]
}

/** 카테고리별 풀이 결과 */
export interface CategoryResult {
  solved: boolean
  correct: boolean
}

export type WeekResults = Partial<Record<QuizCategory, CategoryResult>>

interface UseWeeklyQuizReturn {
  weekKey: string
  results: WeekResults
  /** 이번 주 전체 정답 수 */
  correctCount: number
  /** 올클리어 여부 */
  isAllClear: boolean
  /** 카테고리별 문제 가져오기 */
  getQuestion: (cat: QuizCategory) => QuizQuestion
  /** 정답 제출 — 내부에서 addXp 호출 후 결과 반환 */
  submitAnswer: (cat: QuizCategory, selectedIdx: number) => { correct: boolean; leveledUp: boolean }
}

const STORAGE_KEY = "dukgu_quiz_results"

export function useWeeklyQuiz(): UseWeeklyQuizReturn {
  const weekKey = useMemo(() => getCurrentWeekKey(), [])
  const { addXp } = useUser()

  // localStorage에서 이번 주차 결과만 꺼냅니다
  const [results, setResults] = useState<WeekResults>(() => {
    if (typeof window === "undefined") return {}
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
      return (all[weekKey] as WeekResults) ?? {}
    } catch {
      return {}
    }
  })

  // 결과가 바뀔 때마다 localStorage에 저장합니다
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
      all[weekKey] = results
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    } catch {
      // localStorage 접근 불가 환경(Safari 프라이빗)에서는 조용히 무시합니다
    }
  }, [results, weekKey])

  const correctCount = Object.values(results).filter((r) => r?.correct).length
  const isAllClear = correctCount === QUIZ_CATEGORIES.length

  const getQuestion = useCallback(
    (cat: QuizCategory) => getQuestionForWeek(cat, weekKey),
    [weekKey]
  )

  const submitAnswer = useCallback(
    (cat: QuizCategory, selectedIdx: number): { correct: boolean; leveledUp: boolean } => {
      const question = getQuestionForWeek(cat, weekKey)
      const correct = question.answer === selectedIdx

      // 이미 풀었다면 무시합니다
      if (results[cat]?.solved) return { correct, leveledUp: false }

      let leveledUp = false

      setResults((prev) => {
        const next = { ...prev, [cat]: { solved: true, correct } }

        if (correct) {
          // 정답 XP 지급
          const xpResult = addXp("quiz_correct", XP_PER_CORRECT, `${cat} 퀴즈 정답`)
          leveledUp = xpResult.leveledUp

          // 올클리어 보너스 체크 — 이번 제출로 4개가 다 맞는지 확인합니다
          const newCorrectCount = Object.values(next).filter((r) => r?.correct).length
          if (newCorrectCount === QUIZ_CATEGORIES.length) {
            const bonusResult = addXp("quiz_bonus", BONUS_XP, "주간 퀴즈 올클리어 보너스")
            if (bonusResult.leveledUp) leveledUp = true
          }
        }

        return next
      })

      return { correct, leveledUp }
    },
    [results, weekKey, addXp]
  )

  return { weekKey, results, correctCount, isAllClear, getQuestion, submitAnswer }
}
