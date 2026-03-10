"use client"

import { useState, useEffect } from "react"
import type { StaticImageData } from "next/image"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

// ─── 상수 ───────────────────────────────────────────────────
const VOTE_USER_KEY_STORAGE = "dukgu_vote_user_key"
const VOTE_VOTED_PREFIX     = "dukgu_vote_voted_"   // + question_id

function getVoteUserKey(): string {
  let key = localStorage.getItem(VOTE_USER_KEY_STORAGE)
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem(VOTE_USER_KEY_STORAGE, key)
  }
  return key
}

// ─── 타입 ───────────────────────────────────────────────────
interface VoteQuestion {
  id:          string
  question:    string
  active_date: string
  o_count:     number
  x_count:     number
}

// ─── 헬퍼 ───────────────────────────────────────────────────
function getResultComment(choice: "O" | "X", oPercent: number): string {
  const xPercent = 100 - oPercent
  if (choice === "O" && oPercent >= 60) return "낙관파 우세! 📈"
  if (choice === "O" && oPercent < 40)  return "역발상 투자자군요 💡"
  if (choice === "X" && xPercent >= 60) return "신중파 우세! 📉"
  return "팽팽한 눈치게임 ⚖️"
}

// ─── 컴포넌트 ────────────────────────────────────────────────
interface VoteCardProps {
  catIcon?: StaticImageData | string
}

export function VoteCard({ catIcon }: VoteCardProps) {
  const [question,   setQuestion]   = useState<VoteQuestion | null>(null)
  const [voted,      setVoted]      = useState<"O" | "X" | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // ── 오늘의 질문 + 이전 투표 여부 로드 ──
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]

    supabase
      .from("vote_questions")
      .select("*")
      .eq("active_date", today)
      .single()
      .then(({ data }) => {
        if (data) {
          setQuestion(data as VoteQuestion)
          // localStorage에서 이전 투표 확인
          const prev = localStorage.getItem(VOTE_VOTED_PREFIX + data.id)
          if (prev === "O" || prev === "X") setVoted(prev)
        }
        setLoading(false)
      })
  }, [])

  // ── 투표 처리 ──
  const handleVote = async (choice: "O" | "X") => {
    if (!question || voted || submitting) return
    setSubmitting(true)

    const userKey = getVoteUserKey()

    const { data, error } = await supabase.rpc("cast_vote", {
      p_question_id: question.id,
      p_user_key:    userKey,
      p_choice:      choice,
    })

    if (!error && data) {
      // DB 반환 카운트로 실시간 갱신
      setQuestion(prev => prev
        ? { ...prev, o_count: data.o_count, x_count: data.x_count }
        : prev
      )
    }

    // already_voted 여부와 무관하게 로컬 상태 + localStorage 저장
    setVoted(choice)
    localStorage.setItem(VOTE_VOTED_PREFIX + question.id, choice)
    setSubmitting(false)
  }

  // ── 로딩 스켈레톤 ──
  if (loading) {
    return (
      <div className="rounded-[24px] bg-white p-4 shadow-sm border border-slate-100 h-[152px] animate-pulse" />
    )
  }

  // 오늘 질문 없으면 렌더 생략
  if (!question) return null

  const total    = question.o_count + question.x_count
  const oPercent = total === 0 ? 50 : Math.round((question.o_count / total) * 100)
  const xPercent = 100 - oPercent

  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm border border-slate-100 transition-all w-full flex flex-col group">

      {/* 상단: 카테고리 뱃지 & 결과 코멘트 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 uppercase tracking-tight flex items-center gap-1">
          {catIcon ? (
            <div className="relative h-3 w-3 rounded-full overflow-hidden shrink-0">
              <Image src={catIcon} alt="Cat Icon" fill className="object-cover" />
            </div>
          ) : "⚖️"}
          개미들의 시선
        </span>
        {voted && (
          <span className="text-[10px] font-bold text-slate-500 tracking-tight animate-in fade-in duration-300">
            {getResultComment(voted, oPercent)}
          </span>
        )}
      </div>

      {/* 질문 */}
      <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-3 whitespace-pre-wrap break-keep group-hover:text-purple-600 transition-colors">
        {question.question}
      </h3>

      {/* 투표 전 버튼 */}
      {!voted && (
        <div className="grid grid-cols-2 gap-2 mb-1.5">
          <button
            onClick={() => handleVote("O")}
            disabled={submitting}
            className="py-2.5 rounded-xl text-[13px] font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
          >
            🔥 돌파한다 (O)
          </button>
          <button
            onClick={() => handleVote("X")}
            disabled={submitting}
            className="py-2.5 rounded-xl text-[13px] font-bold text-sky-600 bg-sky-50 border border-sky-100 hover:bg-sky-100 active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
          >
            🧊 안 한다 (X)
          </button>
        </div>
      )}

      {/* 투표 후 결과 바 */}
      {voted && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out mb-1.5">
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
              <span className={`text-[12px] font-bold ${voted === "O" ? "text-rose-500" : "text-slate-400"}`}>
                {oPercent}% 돌파🔥
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[12px] font-bold ${voted === "X" ? "text-sky-600" : "text-slate-400"}`}>
                안 함🧊 {xPercent}%
              </span>
              {voted === "X" && (
                <span className="text-[9px] font-black bg-sky-100 text-sky-500 px-1.5 py-0.5 rounded-md">내 선택</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 하단: 총 참여자 수 */}
      <div className="mt-auto pt-2.5 border-t border-slate-50/50">
        <p className="text-[11px] text-slate-400 font-medium text-center">
          총 {total.toLocaleString()}명 참여
        </p>
      </div>
    </div>
  )
}
