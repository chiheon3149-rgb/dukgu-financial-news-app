"use client"

import { NewsInteractionBar } from "./news-interaction-bar"
import type { NewsCategory } from "@/types"

// ─── 카테고리별 뱃지 색상 맵 ─────────────────────────────────
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

// ─── Props ──────────────────────────────────────────────────
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
    <article className={`p-[14px] border-b border-[#F1F5F9] cursor-pointer flex flex-col gap-2 group ${isDukguPick ? "border-l-2 border-l-emerald-400 pl-3" : ""}`}>

      {/* 카테고리 태그 */}
      <div className="flex items-center gap-1.5">
        <span className={`${getCategoryBadgeStyle(category)} px-2 py-0.5 text-[11px] font-medium rounded-md`}>
          {category}
        </span>
        {isDukguPick && (
          <span className="bg-emerald-500 text-white px-2 py-0.5 text-[11px] font-medium rounded-md">
            덕구픽
          </span>
        )}
      </div>

      {/* 헤드라인 */}
      <h3 className="text-[15px] font-semibold text-slate-900 leading-[1.4] line-clamp-2 break-keep group-hover:text-emerald-600 transition-colors">
        {headline}
      </h3>

      {/* 해시태그 — 최대 2개 */}
      {uniqueTags.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {uniqueTags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-gray-500 text-[11px]">
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      {/* 메타 행: 시간(좌) + 인터랙션(우) */}
      <NewsInteractionBar
        newsId={id}
        initialGood={goodCount}
        initialBad={badCount}
        commentCount={commentCount}
        timeAgo={timeAgo}
        showDislike={false}
        snapshot={id ? { headline, category, timeAgo, tags } : undefined}
      />
    </article>
  )
}
