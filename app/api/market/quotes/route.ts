import { NextResponse } from "next/server"
import { yahooFetch } from "@/lib/yahoo-finance"

// =============================================================================
// 📡 /api/market/quotes
//
// 사용자가 요청한 티커들(예: AAPL,TSLA,005930.KS)의 실시간 시세를 가져옵니다.
// 서버 인스턴스 내 2분 캐시: 동일 티커셋 요청은 Yahoo Finance를 재호출하지 않음
// =============================================================================

const cache = new Map<string, { data: unknown[]; at: number }>()
const CACHE_TTL = 2 * 60 * 1000 // 2분

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tickersStr = searchParams.get("tickers")

    if (!tickersStr) {
      return NextResponse.json({ error: "조회할 티커가 없습니다." }, { status: 400 })
    }

    // 캐시 확인
    const cacheKey = tickersStr.toUpperCase()
    const hit = cache.get(cacheKey)
    if (hit && Date.now() - hit.at < CACHE_TTL) {
      return NextResponse.json(hit.data)
    }

    const tickers = tickersStr.split(",").map((t) => t.trim().toUpperCase())
    const raw = await yahooFetch(tickers)

    const quotes = raw.map((q: any) => ({
      ticker: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      currentPrice: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      currency: q.currency,
    }))

    cache.set(cacheKey, { data: quotes, at: Date.now() })
    return NextResponse.json(quotes)
  } catch (err: any) {
    console.error("[market/quotes] 실패:", err.message)
    return NextResponse.json([], { status: 502 })
  }
}
