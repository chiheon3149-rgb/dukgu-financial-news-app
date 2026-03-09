"use client"

import { useState } from "react"
import type { StaticImageData } from "next/image"
import Image from "next/image"

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

interface VoteCardProps {
  catIcon?: StaticImageData | string; 
}

export function VoteCard({ catIcon }: VoteCardProps) {
  const q = getTodayQuestion()
  const [voted, setVoted] = useState<"O" | "X" | null>(null)
  
  const total = q.total + (voted ? 1 : 0)
  const oPercent = voted === "O" ? Math.round(((q.total * q.oPercent / 100) + 1) / total * 100) : q.oPercent
  const xPercent = 100 - oPercent

  return (
    // 💡 뉴스 카드(NewsCard)와 완벽하게 동일한 뼈대 (rounded-24px, p-4, shadow-sm, border-slate-100)
    <div className="rounded-[24px] bg-white p-4 shadow-sm border border-slate-100 transition-all mx-4 flex flex-col group">
      
      {/* 상단: 카테고리 뱃지 & 코멘트 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {/* 💡 뉴스 카드의 카테고리 뱃지 스타일(각진 rounded-md, 10px 폰트) 차용 */}
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 uppercase tracking-tight flex items-center gap-1">
            {catIcon ? (
              <div className="relative h-3 w-3 rounded-full overflow-hidden shrink-0">
                <Image src={catIcon} alt="Cat Icon" fill className="object-cover" />
              </div>
            ) : "📊"}
            개미들의 시선
          </span>
        </div>
        {voted && (
          <span className="text-[10px] font-bold text-slate-500 tracking-tight animate-in fade-in duration-300">
            {getResultComment(voted, oPercent)}
          </span>
        )}
      </div>

      {/* 질문 (뉴스 카드의 헤드라인 스타일 완벽 이식) */}
      <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-3 whitespace-pre-wrap break-keep group-hover:text-purple-600 transition-colors">
        {q.question}
      </h3>

      {/* 투표 전 */}
      {!voted && (
        <div className="grid grid-cols-2 gap-2 mb-1.5">
          {/* 💡 버튼 디자인을 더 각지고 단정하게 변경 (rounded-xl) */}
          <button
            onClick={() => setVoted("O")}
            className="py-2.5 rounded-xl text-[13px] font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 active:scale-[0.98] transition-all duration-200"
          >
            🔥 돌파한다 (O)
          </button>
          <button
            onClick={() => setVoted("X")}
            className="py-2.5 rounded-xl text-[13px] font-bold text-sky-600 bg-sky-50 border border-sky-100 hover:bg-sky-100 active:scale-[0.98] transition-all duration-200"
          >
            🧊 안 한다 (X)
          </button>
        </div>
      )}

      {/* 투표 후 */}
      {voted && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out mb-1.5">
          {/* 💡 게이지 바 얇고 단정하게 축소 (h-2) */}
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-slate-100 border border-slate-200/50">
            <div
              className="bg-rose-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${oPercent}%` }}
            />
            <div className="bg-sky-400 rounded-full flex-1 transition-all duration-700 ease-out" />
          </div>

          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              {voted === "O" && (
                <span className="text-[9px] font-black bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-md">내 선택</span>
              )}
              <span className={`text-[12px] font-bold ${voted === 'O' ? 'text-rose-500' : 'text-slate-400'}`}>
                {oPercent}% 돌파🔥
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[12px] font-bold ${voted === 'X' ? 'text-sky-600' : 'text-slate-400'}`}>
                안 함🧊 {xPercent}%
              </span>
              {voted === "X" && (
                <span className="text-[9px] font-black bg-sky-100 text-sky-500 px-1.5 py-0.5 rounded-md">내 선택</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 💡 하단 (뉴스 카드의 하단 인터랙션 바 영역과 디자인 일치) */}
      <div className="mt-auto pt-2.5 border-t border-slate-50/50">
        <p className="text-[11px] text-slate-400 font-medium text-center">
          총 {(total).toLocaleString()}명 참여
        </p>
      </div>
    </div>
  )
}