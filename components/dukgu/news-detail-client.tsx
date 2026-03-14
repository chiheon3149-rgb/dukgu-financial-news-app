"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Home, ExternalLink, Clock, Globe, Bookmark, Share2, Loader2, Eye, Edit2, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { getCategoryBadgeStyle } from "@/lib/utils"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { DukguReaction } from "@/components/dukgu/dukgu-reaction"
import { AiDisclaimer } from "@/components/dukgu/ai-disclaimer"
import { DukguAiSummary } from "@/components/dukgu/dukgu-ai-summary"
import { NewsCommentSection } from "@/components/dukgu/news-comment-section"
import { ShareButton } from "@/components/dukgu/share-button"
import { supabase } from "@/lib/supabase"
import { updateCachedCommentCountInFeed } from "@/hooks/use-news-feed"
import { useSavedArticles } from "@/hooks/use-saved-articles"
import { useUser } from "@/context/user-context"
import { useNewsAdmin } from "@/hooks/use-news-admin"
import { useKrStockNames } from "@/hooks/use-kr-stock-names"
import { AdBanner } from "@/components/dukgu/ad-banner"

// =============================================================================
// 타입
// =============================================================================

interface NewsDetail {
  id: string | number
  category: string
  tags: string[] | any
  tickers: string[] | any
  headline: string
  body_summary: string | null
  source: string | null
  source_url: string | null
  ai_summary: string | null
  published_at: string
  created_at: string
  good_count: number
  bad_count: number
  comment_count: number
  view_count: number
  issue_badge: "호재" | "악재" | "중립" | "표시안함" | null
}

interface TickerQuote {
  ticker: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  currency: string
}

// =============================================================================
// 헬퍼 함수
// =============================================================================

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${day} ${h}:${min}`
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "방금 전"
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

/** 한국 6자리 숫자 티커 → Yahoo Finance용 .KS 추가 */
function toYahooTicker(ticker: string): string {
  if (/^\d{6}$/.test(ticker)) return `${ticker}.KS`
  return ticker
}

// =============================================================================
// 이슈 뱃지
// =============================================================================

function IssueBadge({ type }: { type: "호재" | "악재" | "중립" }) {
  const config = {
    호재: { emoji: "🔥", cls: "bg-red-50 text-red-600 border-red-200" },
    악재: { emoji: "🧊", cls: "bg-blue-50 text-blue-600 border-blue-200" },
    중립: { emoji: "💡", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  }
  const c = config[type]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] text-[11px] font-bold rounded-full border ${c.cls}`}>
      {c.emoji} {type}
    </span>
  )
}

// =============================================================================
// 티커 카드 (클릭 시 /assets/stock/[ticker])
// =============================================================================

function TickerCard({ ticker, displayName, quote }: { ticker: string; displayName?: string; quote?: TickerQuote }) {
  const isUp   = (quote?.changePercent ?? 0) > 0
  const isDown = (quote?.changePercent ?? 0) < 0
  const pct    = quote ? `${isUp ? "+" : ""}${quote.changePercent.toFixed(2)}%` : null
  const name   = displayName || quote?.name || ticker

  return (
    <Link
      href={`/assets/stock/${ticker}`}
      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all active:scale-95 border-l-[3px] bg-slate-50 hover:bg-slate-100 border border-slate-100 ${
        isUp ? "border-l-red-400" : isDown ? "border-l-blue-400" : "border-l-slate-300"
      }`}
    >
      <div className="flex flex-col min-w-0 gap-0.5">
        <span className="text-[13px] font-extrabold text-slate-800 leading-none">{name}</span>
        <span className="text-[10px] text-slate-400 font-medium">{ticker}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {quote ? (
          <>
            <span className="text-[13px] font-bold text-slate-700">
              {quote.currency === "KRW"
                ? quote.currentPrice.toLocaleString("ko-KR") + "원"
                : "$" + quote.currentPrice.toFixed(2)}
            </span>
            <span className={`flex items-center gap-0.5 text-[12px] font-black px-1.5 py-0.5 rounded-md ${
              isUp ? "bg-red-50 text-red-500" : isDown ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-400"
            }`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {pct}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-slate-300 animate-pulse">로딩 중</span>
        )}
      </div>
    </Link>
  )
}

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export function NewsDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { profile } = useUser()
  const [news, setNews] = useState<NewsDetail | null | undefined>(undefined)
  const [liveViewCount, setLiveViewCount] = useState(0)
  const [liveCommentCount, setLiveCommentCount] = useState(0)
  const [tickerQuotes, setTickerQuotes] = useState<Record<string, TickerQuote>>({})
  const { isSaved, toggleSave } = useSavedArticles()
  const { deleteNews } = useNewsAdmin()
  const isAdmin = profile?.is_admin === true
  const hasIncremented = useRef(false)

  // 뉴스 로드 + 조회수 증가
  useEffect(() => {
    if (!id || hasIncremented.current) return
    hasIncremented.current = true

    const load = async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .single()

      if (error || !data) { setNews(null); return }

      setNews(data)
      setLiveCommentCount(data.comment_count ?? 0)
      setLiveViewCount((data.view_count ?? 0) + 1)

      try {
        await supabase.rpc("increment_news_view_count", { target_news_id: id })
      } catch {}
    }

    load()
  }, [id])

  // 티커 시세 fetch
  useEffect(() => {
    const tickers: string[] = news?.tickers ?? []
    if (!tickers.length) return

    const yahooTickers = tickers.map(toYahooTicker).join(",")
    fetch(`/api/market/quotes?tickers=${encodeURIComponent(yahooTickers)}`)
      .then((r) => r.json())
      .then((quotes: TickerQuote[]) => {
        const map: Record<string, TickerQuote> = {}
        quotes.forEach((q) => {
          // Yahoo 심볼(.KS 제거)을 원본 티커로 역매핑
          const raw = q.ticker.replace(/\.(KS|KQ)$/i, "")
          map[raw] = { ...q, ticker: raw }
        })
        setTickerQuotes(map)
      })
      .catch(() => {})
  }, [news?.tickers])

  const handleDelete = async () => {
    if (!window.confirm("정말 이 뉴스를 삭제하시겠습니까? (복구 불가) 🚨")) return
    try {
      await deleteNews(id)
      toast.success("뉴스가 깔끔하게 삭제되었다냥! 🗑️")
      router.replace("/")
    } catch {
      toast.error("삭제 중 오류가 발생했다냥.")
    }
  }

  // 한국 주식 티커 → 한국어 기업명 매핑 (early return 전에 선언해야 Rules of Hooks 준수)
  const rawTickers: string[] = Array.isArray(news?.tickers) ? news.tickers : []
  const ksTickers = rawTickers.filter((t) => /^\d{6}$/.test(t)).map((t) => `${t}.KS`)
  const krNames = useKrStockNames(ksTickers)

  const newsIdStr = news ? String(news.id) : ""
  const isBookmarked = news ? isSaved(newsIdStr) : false

  const toggleBookmark = () => {
    if (!profile) {
      toast("로그인이 필요한 기능이다냥! 🐾", {
        description: "기사를 저장하려면 덕구네 식구가 되어 달라냥.",
        action: { label: "로그인하기", onClick: () => router.push("/login") },
      })
      return
    }
    if (!news) return
    const tags: string[] = Array.isArray(news.tags) ? news.tags : []
    toggleSave(newsIdStr, {
      headline: news.headline,
      category: news.category as any,
      timeAgo: getTimeAgo(news.published_at),
      tags,
    })
    if (!isBookmarked) toast.success("간식 창고(북마크)에 저장했다냥! 🐾")
  }

  // ─── 로딩 상태 ───────────────────────────────────────────
  if (news === undefined) {
    return (
      <div className="min-h-dvh bg-white">
        <DetailHeader title="뉴스 상세" />
        <div className="flex flex-col items-center justify-center h-80 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-400 text-xs font-medium">덕구가 뉴스를 가져오고 있다냥...</p>
        </div>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="min-h-dvh bg-white">
        <DetailHeader title="뉴스 상세" />
        <div className="flex items-center justify-center h-60 text-slate-400 text-sm font-medium">
          뉴스를 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  const tags: string[]    = Array.isArray(news.tags)    ? news.tags    : []
  const tickers: string[] = Array.isArray(news.tickers) ? news.tickers : []
  const isDukguPick       = news.source === "덕구"

  const getTickerDisplay = (ticker: string) => {
    if (/^\d{6}$/.test(ticker)) return krNames[`${ticker}.KS`] ?? tickerQuotes[ticker]?.name ?? ticker
    return tickerQuotes[ticker]?.name ?? ticker
  }

  // ─── 본문 렌더링 ──────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-white pb-24">
      <DetailHeader
        title="뉴스 상세"
        rightElement={
          <div className="flex items-center gap-1">
            {isAdmin && (
              <>
                <button
                  onClick={() => router.push(`/news/${news.id}/edit`)}
                  className="p-1.5 hover:bg-indigo-50 rounded-full transition-colors group"
                  aria-label="뉴스 수정"
                >
                  <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 hover:bg-red-50 rounded-full transition-colors group"
                  aria-label="뉴스 삭제"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
              </>
            )}
            <Link href="/" className="p-1.5 hover:bg-emerald-50 rounded-full transition-colors group">
              <Home className="w-5 h-5 text-slate-800 group-hover:text-emerald-600" />
            </Link>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6">

        {/* 카테고리 + 이슈뱃지 */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`${getCategoryBadgeStyle(news.category)} px-2.5 py-[3px] text-[11px] font-semibold rounded-full`}>
            {news.category}
          </span>
          {isDukguPick && (
            <span className="bg-emerald-500 text-white px-2.5 py-[3px] text-[11px] font-semibold rounded-full">
              덕구픽
            </span>
          )}
          {news.issue_badge && news.issue_badge !== "표시안함" && (
            <IssueBadge type={news.issue_badge as "호재" | "악재" | "중립"} />
          )}
        </div>

        {/* 해시태그 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span key={tag} className="text-[12px] font-semibold text-emerald-600">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}

        {/* 헤드라인 + 우측 버튼 */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight break-keep tracking-tight">
            {news.headline}
          </h2>
          <div className="flex flex-col gap-2 shrink-0">
            {news.source_url && (
              <a
                href={news.source_url.startsWith("http") ? news.source_url : `https://${news.source_url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors border border-transparent hover:border-emerald-100"
              >
                원문보기 <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={toggleBookmark}
              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                isBookmarked
                  ? "bg-emerald-500 text-white shadow-md transform scale-105"
                  : "bg-white border border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500"
              }`}
            >
              <Bookmark className={`w-3 h-3 ${isBookmarked ? "fill-white" : ""}`} />
              {isBookmarked ? "저장됨" : "저장하기"}
            </button>
            <ShareButton
              title={`[덕구의 뉴스] ${news.headline}`}
              text={news.body_summary || "매일 아침, 당신을 위한 금융 뉴스 브리핑"}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-white border border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500"
            >
              <Share2 className="w-3 h-3" />
              공유하기
            </ShareButton>
          </div>
        </div>

        {/* 출처 + 시간 + 조회수 */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mb-6">
          {news.source && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> {news.source}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatDate(news.published_at)}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <Eye className="w-3 h-3 text-slate-300" />
            <span className="font-bold">{liveViewCount}</span>
          </div>
        </div>

        {/* 관련 종목 티커 */}
        {tickers.length > 0 && (
          <section className="mb-8">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5">관련 종목</p>
            <div className="flex flex-col gap-2">
              {tickers.map((ticker) => (
                <TickerCard key={ticker} ticker={ticker} displayName={getTickerDisplay(ticker)} quote={tickerQuotes[ticker]} />
              ))}
            </div>
          </section>
        )}

        {/* AI 요약 */}
        {news.ai_summary && (
          <div className="mb-8">
            <DukguAiSummary summary={news.ai_summary} />
          </div>
        )}

        {/* 본문 */}
        <article className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium mb-10 break-keep">
          {news.body_summary}
        </article>

        <AiDisclaimer />

        <div className="my-8">
          <DukguReaction
            initialGood={news.good_count}
            initialBad={news.bad_count}
            viewCount={liveViewCount}
            commentCount={liveCommentCount}
            newsId={newsIdStr}
            snapshot={{ headline: news.headline, category: news.category, timeAgo: getTimeAgo(news.published_at) }}
          />
        </div>

        <div className="mb-8">
          <AdBanner />
        </div>

        <NewsCommentSection
          newsId={id}
          onCountChange={(count) => {
            setLiveCommentCount(count)
            updateCachedCommentCountInFeed(id, count)
          }}
        />
      </main>
    </div>
  )
}
