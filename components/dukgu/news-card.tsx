"use client"

import { NewsInteractionBar } from "./news-interaction-bar"
import type { NewsCategory } from "@/types"

// ─── 카테고리별 뱃지 색상 맵 ─────────────────────────────────
const CATEGORY_BADGE_STYLES: Record<string, string> = {
  "경제":    "bg-[#E8F5E9] text-green-700",
  "정치":    "bg-blue-50 text-blue-600",
  "IT/기술": "bg-purple-50 text-purple-600",
  "IT":      "bg-purple-50 text-purple-600",
  "기술":    "bg-purple-50 text-purple-600",
  "사회":    "bg-orange-50 text-orange-600",
  "금융":    "bg-yellow-50 text-yellow-700",
  "국제":    "bg-sky-50 text-sky-600",
  "부동산":  "bg-rose-50 text-rose-600",
  "증시":    "bg-emerald-50 text-emerald-700",
  "코인":    "bg-indigo-50 text-indigo-600",
}

function getCategoryBadgeStyle(category: string): string {
  return CATEGORY_BADGE_STYLES[category] ?? "bg-gray-100 text-gray-600"
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
    <article className="bg-white rounded-[24px] px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-[0.985] transition-all cursor-pointer flex flex-col group">

      {/* 상단: 카테고리 + FOCUS + 덕구픽 뱃지 + 시간 — 한 줄 */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 카테고리 뱃지 */}
          <span className={`${getCategoryBadgeStyle(category)} px-2 py-1 text-[12px] font-extrabold rounded-md`}>
            {category}
          </span>
          {/* FOCUS 뱃지 — 카테고리 우측에 나란히 */}
          {autoBadge && (
            <span className="bg-red-50 text-[#FF3B30] font-bold text-[12px] px-2 py-0.5 rounded-md">
              {autoBadge.ticker}
            </span>
          )}
          {/* 덕구픽 뱃지 */}
          {isDukguPick && (
            <span className="bg-green-500 text-white px-2 py-1 text-[11px] font-bold rounded-md shadow-sm">
              덕구픽
            </span>
          )}
        </div>
        <span className="text-[13px] font-medium text-gray-400 shrink-0 ml-2">{timeAgo}</span>
      </div>

      {/* 헤드라인 */}
      <h3 className="text-[16px] font-bold text-gray-900 tracking-tight leading-snug mb-2.5 group-hover:text-[#00C48C] transition-colors line-clamp-2 break-keep">
        {headline}
      </h3>

      {/* 해시태그 */}
      {uniqueTags.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5 gap-y-1 mb-3">
          {uniqueTags.map((tag, idx) => (
            <span key={idx} className="bg-blue-50/50 text-blue-500 text-[12px] font-medium px-1.5 py-0.5 rounded">
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
