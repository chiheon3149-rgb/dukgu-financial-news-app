"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { NewsInteractionBar } from "./news-interaction-bar"
import { getCategoryBadgeStyle } from "@/lib/utils"
import type { NewsCategory, IssueBadge } from "@/types"
import { useKrStockNames } from "@/hooks/use-kr-stock-names"

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
// 티커 칩 (발행 시점 스냅샷 기반)
// =============================================================================

interface TickerSnapshotChip {
  symbol:     string
  change_pct: string
  is_up:      boolean
  is_down:    boolean
}

function TickerChip({ ticker, displayName, snapshot }: {
  ticker: string
  displayName?: string
  snapshot?: TickerSnapshotChip
}) {
  const isUp   = snapshot?.is_up   ?? false
  const isDown = snapshot?.is_down ?? false
  const label  = snapshot?.change_pct ?? null
  const name   = displayName || ticker

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-[2px] text-[10px] font-black rounded-full border ${
        isUp   ? "bg-red-50 text-red-500 border-red-100"
        : isDown ? "bg-blue-50 text-blue-500 border-blue-100"
        : "bg-slate-50 text-slate-500 border-slate-200"
      }`}
    >
      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : isDown ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
      {name}
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
  /** 발행 시점 주가 스냅샷 (뉴스봇이 DB에 저장한 정적 데이터) */
  ticker_snapshots?: TickerSnapshotChip[]
  source?: string | null
  issueBadge?: IssueBadge
  issueKeyword?: string | null
  isBreaking?: boolean
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
  ticker_snapshots = [],
  source,
  issueBadge,
  issueKeyword,
  isBreaking = false,
}: NewsCardProps) {
  const [whyOpen, setWhyOpen] = useState(false)
  const isDukguPick = source === "덕구"
  const uniqueTags  = Array.from(new Set(tags))

  const explanationText = aiSummary || summary || ""
  const points = explanationText ? parsePoints(explanationText) : []

  // 한국 주식 티커 → 한국어 기업명 매핑
  const ksTickers = tickers.filter((t) => /^\d{6}$/.test(t)).map((t) => `${t}.KS`)
  const krNames = useKrStockNames(ksTickers)
  const getTickerDisplay = (ticker: string) => {
    if (/^\d{6}$/.test(ticker)) return krNames[`${ticker}.KS`] ?? ticker
    return ticker
  }

  // 스냅샷 맵 (symbol → snapshot)
  const snapshotMap = ticker_snapshots.reduce<Record<string, TickerSnapshotChip>>(
    (acc, s) => { acc[s.symbol] = s; return acc },
    {}
  )

  return (
    <article className={`rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.07)] p-4 flex flex-col gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 ${
      isBreaking ? "bg-amber-50/60 border border-amber-100" : "bg-white"
    }`}>

      {/* 카테고리 + 이슈뱃지 + 시간 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className={`${getCategoryBadgeStyle(category)} px-2.5 py-[3px] text-[11px] font-semibold rounded-full shrink-0`}>
            {category}
          </span>
          {isBreaking && (
            <span className="bg-red-100 text-red-400 px-2.5 py-[3px] text-[11px] font-bold rounded-full shrink-0">
              속보
            </span>
          )}
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

      {/* 티커 칩 행 (발행 시점 스냅샷) */}
      {tickers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tickers.map((ticker) => (
            <TickerChip key={ticker} ticker={ticker} displayName={getTickerDisplay(ticker)} snapshot={snapshotMap[ticker]} />
          ))}
        </div>
      )}

      {/* 왜 중요해? + 해시태그 인라인 */}
      {(points.length > 0 || uniqueTags.length > 0) && (
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {points.length > 0 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWhyOpen((v) => !v) }}
                className="flex items-center gap-1.5 py-[5px] px-3 rounded-full bg-amber-50 text-amber-700 text-[12px] font-semibold transition-all duration-200 hover:bg-amber-100 active:scale-95 shrink-0"
              >
                <span>👀</span>
                <span>왜 중요해?</span>
              </button>
            )}
            {uniqueTags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="text-[11px] font-medium text-gray-400">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>

          {points.length > 0 && (
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
          )}
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
