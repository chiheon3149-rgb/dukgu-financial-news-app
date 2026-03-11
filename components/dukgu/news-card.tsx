"use client"

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

interface NewsCardProps {
  id?: string
  category: NewsCategory
  headline: string
  summary?: string
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
  timeAgo,
  goodCount,
  badCount,
  commentCount,
  tags = [],
  source,
}: NewsCardProps) {
  const isDukguPick = source === "덕구"
  const uniqueTags  = Array.from(new Set(tags))

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
