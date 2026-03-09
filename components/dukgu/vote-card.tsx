"use client"

import { useState } from "react"

interface VoteQ {
  id: string
  question: string
  oPercent: number
  total: number
}

const VOTE_QUESTIONS: VoteQ[] = [
  { id: "btc-1b",    question: "오늘 밤 비트코인 1억 재돌파 한다?",  oPercent: 73, total: 1847 },
  { id: "kospi-3k",  question: "이번 달 코스피 3,000 회복 가능?",    oPercent: 41, total: 2314 },
  { id: "nvidia-ath",question: "NVIDIA 이번 분기 사상 최고가 경신?", oPercent: 68, total: 903  },
]

function getTodayQuestion(): VoteQ {
  return VOTE_QUESTIONS[new Date().getDate() % VOTE_QUESTIONS.length]
}

function getResultComment(choice: "O" | "X", oPercent: number): string {
  const xPercent = 100 - oPercent
  if (choice === "O" && oPercent >= 60) return "낙관파 우세! 📈"
  if (choice === "O" && oPercent < 40)  return "역발상 투자자군요 💡"
  if (choice === "X" && xPercent >= 60) return "신중파 우세! 📉"
  return "팽팽한 눈치게임 ⚖️"
}

export function VoteCard() {
  const q = getTodayQuestion()
  const [voted, setVoted] = useState<"O" | "X" | null>(null)
  const oPercent = q.oPercent
  const xPercent = 100 - oPercent

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-black text-slate-500 tracking-wide">
          👀 개미들의 시선 🐜
        </span>
        {voted && (
          <span className="text-[10px] font-semibold text-slate-400">
            {getResultComment(voted, oPercent)}
          </span>
        )}
      </div>

      {/* 질문 */}
      <p className="text-[13px] font-bold text-slate-800 leading-snug mb-3">
        {q.question}
      </p>

      {/* 투표 전 */}
      {!voted && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setVoted("O")}
            className="py-2.5 rounded-xl text-[12px] font-black text-rose-600 bg-rose-50 border border-rose-200 active:scale-95 active:bg-rose-100 transition-all"
          >
            🔥 돌파한다
          </button>
          <button
            onClick={() => setVoted("X")}
            className="py-2.5 rounded-xl text-[12px] font-black text-sky-600 bg-sky-50 border border-sky-200 active:scale-95 active:bg-sky-100 transition-all"
          >
            🧊 안 한다
          </button>
        </div>
      )}

      {/* 투표 후 */}
      {voted && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-slate-100">
            <div
              className="bg-rose-400 rounded-l-full transition-all duration-700 ease-out"
              style={{ width: `${oPercent}%` }}
            />
            <div className="bg-sky-400 rounded-r-full flex-1 transition-all duration-700 ease-out" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {voted === "O" && (
                <span className="text-[9px] font-black bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full">내 선택</span>
              )}
              <span className="text-[11px] font-black text-rose-500">{oPercent}% 돌파</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-black text-sky-500">안 함 {xPercent}%</span>
              {voted === "X" && (
                <span className="text-[9px] font-black bg-sky-100 text-sky-500 px-1.5 py-0.5 rounded-full">내 선택</span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium text-center">
            총 {(q.total + 1).toLocaleString()}명 참여
          </p>
        </div>
      )}
    </div>
  )
}
