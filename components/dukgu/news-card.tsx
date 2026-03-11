"use client"

import { NewsInteractionBar } from "./news-interaction-bar"
import type { NewsCategory } from "@/types"

// ─── 카테고리별 뱃지 색상 맵 ─────────────────────────────────
const CATEGORY_BADGE_STYLES: Record<string, string> = {
  "경제":    "bg-emerald-50 text-emerald-700",
  "정치":    "bg-blue-50 text-blue-600",
  "IT/기술": "bg-violet-50 text-violet-600",
  "IT":      "bg-violet-50 text-violet-600",
  "기술":    "bg-violet-50 text-violet-600",
  "사회":    "bg-orange-50 text-orange-600",
  "금융":    "bg-amber-50 text-amber-700",
  "국제":    "bg-sky-50 text-sky-600",
  "부동산":  "bg-rose-50 text-rose-600",
  "증시":    "bg-emerald-50 text-emerald-700",
  "코인":    "bg-indigo-50 text-indigo-600",
}

function getCategoryBadgeStyle(category: string): string {
  return CATEGORY_BADGE_STYLES[category] ?? "bg-slate-100 text-slate-500"
}

// ─── FOCUS chip 이슈 키워드 ──────────────────────────────────
const ISSUE_KEYWORDS = [
  "급등", "급락", "상승", "하락", "폭등", "폭락", "돌파", "붕괴",
  "최고", "최저", "쇼크", "위기", "우려", "호재", "악재", "발표", "타결",
]

function isTickerLike(tag: string): boolean {
  const trimmed = tag.replace(/^#/, "")
  return trimmed.length >= 2 && trimmed.length <= 12
}

interface AutoBadge {
  ticker: string
  icon: string
  label: string
}

function getAutoBadge(tags: string[]): AutoBadge | null {
  if (!tags || tags.length === 0) return null
  const cleanedTags = tags.map((t) => t.replace(/^#/, ""))
  const hasIssue = cleanedTags.some((t) => ISSUE_KEYWORDS.some((k) => t.includes(k)))
  if (!hasIssue) return null
  const ticker =
    cleanedTags.find((t) => isTickerLike(t) && !ISSUE_KEYWORDS.some((k) => t.includes(k))) ??
    cleanedTags[0]
  return { ticker, icon: "💡", label: "FOCUS" }
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
  const autoBadge   = isDukguPick ? null : getAutoBadge(tags)
  const uniqueTags  = Array.from(new Set(tags))

  return (
    <article className={`bg-white rounded-2xl px-4 pt-3.5 pb-3 border shadow-sm active:scale-[0.988] transition-transform cursor-pointer flex flex-col group ${isDukguPick ? "border-l-[3px] border-l-emerald-400 border-t-slate-100 border-r-slate-100 border-b-slate-100" : "border-slate-100"}`}>

      {/* 상단: 카테고리 + FOCUS + 덕구픽 + 시간 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`${getCategoryBadgeStyle(category)} px-2 py-0.5 text-[11px] font-bold rounded-md`}>
            {category}
          </span>
          {autoBadge && (
            <span className="bg-red-50 text-red-500 font-bold text-[11px] px-2 py-0.5 rounded-md">
              {autoBadge.ticker}
            </span>
          )}
          {isDukguPick && (
            <span className="bg-emerald-500 text-white px-2 py-0.5 text-[11px] font-bold rounded-md">
              덕구픽
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-slate-400 shrink-0 ml-2">{timeAgo}</span>
      </div>

      {/* 헤드라인 */}
      <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight leading-snug mb-2.5 group-hover:text-emerald-600 transition-colors line-clamp-2 break-keep">
        {headline}
      </h3>

      {/* 해시태그 — 심플 인라인 텍스트 */}
      {uniqueTags.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-2.5">
          {uniqueTags.slice(0, 4).map((tag, idx) => (
            <span key={idx} className="text-slate-400 text-[11px] font-medium">
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      <NewsInteractionBar
        newsId={id}
        initialGood={goodCount}
        initialBad={badCount}
        commentCount={commentCount}
        snapshot={id ? { headline, category, timeAgo, tags } : undefined}
      />
    </article>
  )
}
