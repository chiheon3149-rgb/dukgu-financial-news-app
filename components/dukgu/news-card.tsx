"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { NewsInteractionBar } from "./news-interaction-bar"
import { getCategoryBadgeStyle } from "@/lib/utils"
import type { NewsCategory, IssueBadge } from "@/types"

// =============================================================================
// 헬퍼: ai_summary → bullet 배열 파싱
// =============================================================================

function parsePoints(text: string): string[] {
  const numbered = text.match(/\d+\.\s+[^\n]+/g)
  if (numbered && numbered.length >= 2) {
    return numbered.map((s) => s.replace(/^\d+\.\s+/, "").trim())
  }
  const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  if (lines.length >= 2) return lines
  return text.split(/(?<=[.!?])\s+/).slice(0, 3).map((s) => s.trim()).filter(Boolean)
}

// =============================================================================
// 이슈 뱃지 칩
// =============================================================================

function IssueBadgeChip({ type }: { type: IssueBadge }) {
  if (!type) return null
  const config: Record<string, { emoji: string; cls: string }> = {
    호재: { emoji: "🔥", cls: "bg-red-50 text-red-500 border-red-100" },
    악재: { emoji: "🧊", cls: "bg-blue-50 text-blue-500 border-blue-100" },
    중립: { emoji: "💡", cls: "bg-amber-50 text-amber-500 border-amber-100" },
  }
  const c = config[type]
  if (!c) return null
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-[2px] text-[10px] font-bold rounded-full border shrink-0 ${c.cls}`}>
      {c.emoji} {type}
    </span>
  )
}

// =============================================================================
// 티커 칩 (등락률 포함)
// =============================================================================

interface TickerPrice {
  changePercent: number
  currency: string
  currentPrice: number
}

function TickerChip({ ticker, price }: { ticker: string; price?: TickerPrice }) {
  const pct    = price?.changePercent ?? 0
  const isUp   = pct > 0
  const isDown = pct < 0
  const label  = price ? `${isUp ? "+" : ""}${pct.toFixed(1)}%` : null

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-[2px] text-[10px] font-black rounded-full border ${
        isUp   ? "bg-red-50 text-red-500 border-red-100"
        : isDown ? "bg-blue-50 text-blue-500 border-blue-100"
        : "bg-slate-50 text-slate-500 border-slate-200"
      }`}
    >
      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : isDown ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
      {ticker}
      {label && <span className="ml-0.5">{label}</span>}
    </span>
  )
}

// =============================================================================
// Props
// =============================================================================

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
  tickers?: string[]
  tickerPrices?: Record<string, TickerPrice>
  source?: string | null
  issueBadge?: IssueBadge
  issueKeyword?: string | null
}

// =============================================================================
// NewsCard
// =============================================================================

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
  tickers = [],
  tickerPrices = {},
  source,
  issueBadge,
  issueKeyword,
}: NewsCardProps) {
  const [whyOpen, setWhyOpen] = useState(false)
  const isDukguPick = source === "덕구"
  const uniqueTags  = Array.from(new Set(tags))

  const explanationText = aiSummary || summary || ""
  const points = explanationText ? parsePoints(explanationText) : []

  return (
    <article className="rounded-[18px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.07)] p-4 flex flex-col gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">

      {/* 카테고리 + 이슈뱃지 + 시간 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className={`${getCategoryBadgeStyle(category)} px-2.5 py-[3px] text-[11px] font-semibold rounded-full shrink-0`}>
            {category}
          </span>
          {isDukguPick && (
            <span className="bg-emerald-500 text-white px-2.5 py-[3px] text-[11px] font-semibold rounded-full shrink-0">
              덕구픽
            </span>
          )}
          {issueBadge && (
            <IssueBadgeChip type={issueBadge} />
          )}
        </div>
        <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">{timeAgo}</span>
      </div>

      {/* 뉴스 제목 */}
      <h3 className="text-[15px] font-bold text-[#111827] leading-[1.45] line-clamp-2 break-keep">
        {headline}
      </h3>

      {/* 뉴스 요약 */}
      {summary && (
        <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 break-keep">
          {summary}
        </p>
      )}

      {/* 티커 칩 행 */}
      {tickers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tickers.map((ticker) => (
            <TickerChip key={ticker} ticker={ticker} price={tickerPrices[ticker]} />
          ))}
        </div>
      )}

      {/* 해시태그 */}
      {uniqueTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {uniqueTags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-[11px] font-medium text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      {/* 왜 중요해? */}
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

          <div className={`overflow-hidden transition-all duration-300 ${whyOpen ? "max-h-[200px] opacity-100 mt-2.5" : "max-h-0 opacity-0"}`}>
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

      {/* 하단 액션 바 */}
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
