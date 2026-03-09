"use client"

import { NewsInteractionBar } from "./news-interaction-bar"

// -------------------------------------------------------
// 카테고리 스타일
// -------------------------------------------------------
const categoryStyles = {
  정치: "text-red-600 bg-red-50",
  경제: "text-emerald-600 bg-emerald-50",
  사회: "text-slate-600 bg-slate-50",
  문화: "text-purple-600 bg-purple-50",
  IT:   "text-indigo-600 bg-indigo-50",
}

// -------------------------------------------------------
// 💡 [개선] 중립적 오토 뱃지 로직 (이슈/변동성 감지)
// -------------------------------------------------------
// 호재/악재를 나누지 않고, 시장의 '변동성'이나 '주목도'를 나타내는 키워드를 통합합니다.
const ISSUE_KEYWORDS = [
  "급등", "급락", "상승", "하락", "폭등", "폭락", "돌파", "붕괴", 
  "최고", "최저", "쇼크", "위기", "우려", "호재", "악재", "발표", "타결"
]

// 종목처럼 보이는 태그 (짧고 명사형인 것)
function isTickerLike(tag: string): boolean {
  const trimmed = tag.replace(/^#/, "")
  return trimmed.length >= 2 && trimmed.length <= 12
}

interface AutoBadge {
  ticker: string
  icon: string
  bg: string
  text: string
  label: string
}

function getAutoBadge(tags: string[]): AutoBadge | null {
  if (!tags || tags.length === 0) return null

  const cleanedTags = tags.map((t) => t.replace(/^#/, ""))
  
  // 1. 이슈 키워드가 포함된 태그가 하나라도 있는지 스캔합니다.
  const hasIssue = cleanedTags.some((t) => ISSUE_KEYWORDS.some((k) => t.includes(k)))

  if (!hasIssue) return null

  // 2. 이슈 키워드가 아닌, 가장 앞쪽에 있는 짧은 명사(종목명/테마명)를 주어로 뽑습니다.
  const ticker =
    cleanedTags.find((t) => isTickerLike(t) && !ISSUE_KEYWORDS.some((k) => t.includes(k))) ??
    cleanedTags[0]

  // 3. 주관적인 판단 대신 중립적이고 전문적인 FOCUS 뱃지를 리턴합니다.
  return { 
    ticker, 
    icon: "💡", 
    bg: "bg-indigo-50 border border-indigo-100", 
    text: "text-indigo-700",
    label: "FOCUS"
  }
}

// -------------------------------------------------------
// Props
// -------------------------------------------------------
interface NewsCardProps {
  id?: string
  category: keyof typeof categoryStyles
  headline: string
  summary: string
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
  const autoBadge   = getAutoBadge(tags)

  return (
    <article
      className={`rounded-[24px] p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex flex-col h-full group border ${
        isDukguPick
          ? "bg-emerald-50/50 border-emerald-100"
          : "bg-white border-slate-100"
      }`}
    >
      {/* 상단: 카테고리 + 덕구픽 + 시간 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight ${
              categoryStyles[category] ?? "bg-slate-50 text-slate-500"
            }`}
          >
            {category}
          </span>
          {isDukguPick && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white tracking-tight">
              덕구 픽
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold text-slate-400">{timeAgo}</span>
      </div>

      {/* 헤드라인 */}
      <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-emerald-600 transition-colors line-clamp-2">
        {headline}
      </h3>

      {/* 태그 */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, idx) => (
          <span key={idx} className="text-[11px] font-bold text-emerald-600/70 tracking-tight">
            {tag.startsWith("#") ? tag : `#${tag}`}
          </span>
        ))}
      </div>

      {/* 💡 중립적 오토 뱃지 (FOCUS) */}
      {autoBadge && (
        <div className="mb-2">
          <span
            className={`inline-flex items-center gap-1 ${autoBadge.bg} ${autoBadge.text} rounded-full px-2.5 py-1 text-[11px] font-black shadow-sm`}
          >
            {autoBadge.icon} <span className="opacity-70">{autoBadge.label}:</span> {autoBadge.ticker}
          </span>
        </div>
      )}

      {/* 요약 */}
      <p className="text-[12px] text-slate-500 leading-relaxed mb-2.5 line-clamp-2 break-keep opacity-90">
        {summary}
      </p>

      <div className="mt-auto pt-2 border-t border-slate-50/50">
        <NewsInteractionBar
          newsId={id}
          initialGood={goodCount}
          initialBad={badCount}
          commentCount={commentCount}
          snapshot={id ? { headline, category, timeAgo, tags } : undefined}
        />
      </div>
    </article>
  )
}