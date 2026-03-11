"use client"

import { useState } from "react"
import { NewsInteractionBar } from "./news-interaction-bar"
import type { NewsCategory } from "@/types"

// ─── 카테고리별 칩 색상 ────────────────────────────────────────
const CATEGORY_BADGE_STYLES: Record<string, string> = {
  "경제":    "bg-[#ECFDF5] text-emerald-700",
  "정치":    "bg-blue-50 text-blue-600",
  "IT/기술": "bg-violet-50 text-violet-600",
  "IT":      "bg-violet-50 text-violet-600",
  "기술":    "bg-violet-50 text-violet-600",
  "사회":    "bg-orange-50 text-orange-600",
  "금융":    "bg-amber-50 text-amber-700",
  "국제":    "bg-sky-50 text-sky-600",
  "부동산":  "bg-rose-50 text-rose-600",
  "증시":    "bg-[#ECFDF5] text-emerald-700",
  "코인":    "bg-indigo-50 text-indigo-600",
}

function getCategoryBadgeStyle(category: string): string {
  return CATEGORY_BADGE_STYLES[category] ?? "bg-slate-100 text-slate-500"
}

/** ai_summary 텍스트를 번호 기반 bullet 배열로 파싱 */
function parsePoints(text: string): string[] {
  // "1. ...\n2. ...\n3. ..." 형식 먼저 시도
  const numbered = text.match(/\d+\.\s+[^\n]+/g)
  if (numbered && numbered.length >= 2) {
    return numbered.map((s) => s.replace(/^\d+\.\s+/, "").trim())
  }
  // 줄바꿈으로 분리
  const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  if (lines.length >= 2) return lines
  // 마침표로 문장 분리 (최대 3개)
  return text.split(/(?<=[.!?])\s+/).slice(0, 3).map((s) => s.trim()).filter(Boolean)
}

interface NewsCardProps {
  id?: string
  category: NewsCategory
  headline: string
  summary?: string
  aiSummary?: string | null
  timeAgo: string
  goodCount: number
  badCount: number
  commentCount: number
  tags?: string[]
  source?: string | null
}

export function NewsCard({
  id,
  category,
  headline,
  summary,
  aiSummary,
  timeAgo,
  goodCount,
  badCount,
  commentCount,
  tags = [],
  source,
}: NewsCardProps) {
  const [whyOpen, setWhyOpen] = useState(false)
  const isDukguPick = source === "덕구"
  const uniqueTags  = Array.from(new Set(tags))

  const explanationText = aiSummary || summary || ""
  const points = explanationText ? parsePoints(explanationText) : []

  return (
    <article className="rounded-[18px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.07)] p-4 flex flex-col gap-2.5 cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200">

      {/* 카테고리 칩 */}
      <div className="flex items-center gap-1.5">
        <span className={`${getCategoryBadgeStyle(category)} px-2.5 py-[3px] text-[11px] font-semibold rounded-full`}>
          {category}
        </span>
        {isDukguPick && (
          <span className="bg-emerald-500 text-white px-2.5 py-[3px] text-[11px] font-semibold rounded-full">
            덕구픽
          </span>
        )}
      </div>

      {/* 뉴스 제목 */}
      <h3 className="text-[15px] font-bold text-[#111827] leading-[1.45] line-clamp-2 break-keep">
        {headline}
      </h3>

      {/* 뉴스 요약 2줄 */}
      {summary && (
        <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 break-keep">
          {summary}
        </p>
      )}

      {/* 해시태그 */}
      {uniqueTags.length > 0 && (
        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
          {uniqueTags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-[11px] text-gray-400">
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      {/* 시간 */}
      <span className="text-[11px] text-gray-400">{timeAgo}</span>

      {/* 왜 중요해? 버튼 */}
      {points.length > 0 && (
        <div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWhyOpen((v) => !v) }}
            className="flex items-center gap-1.5 py-[5px] px-3 rounded-full bg-amber-50 text-amber-700 text-[12px] font-semibold transition-all duration-200 hover:bg-amber-100 active:scale-95"
          >
            <span>👀</span>
            <span>왜 중요해?</span>
          </button>

          {/* 펼침 패널 */}
          <div
            className={`overflow-hidden transition-all duration-300 ${whyOpen ? "max-h-[200px] opacity-100 mt-2.5" : "max-h-0 opacity-0"}`}
          >
            <div className="rounded-[12px] bg-amber-50 px-3.5 py-3 flex flex-col gap-1.5">
              <p className="text-[11px] font-bold text-amber-700 mb-0.5">왜 중요할까?</p>
              {points.slice(0, 3).map((point, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[11px] font-bold text-amber-500 mt-[1px] shrink-0">{idx + 1}.</span>
                  <span className="text-[12px] text-amber-900 leading-[1.5]">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 하단 액션 — 구분선 */}
      <div className="border-t border-[#F1F5F9] pt-2.5">
        <NewsInteractionBar
          newsId={id}
          initialGood={goodCount}
          initialBad={badCount}
          commentCount={commentCount}
          showDislike={false}
          showEmojiActions
          snapshot={id ? { headline, category, timeAgo, tags } : undefined}
        />
      </div>
    </article>
  )
}
