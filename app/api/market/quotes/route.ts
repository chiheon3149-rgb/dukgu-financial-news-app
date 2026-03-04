import { NextResponse } from "next/server"
import { yahooFetch } from "@/lib/yahoo-finance"

// =============================================================================
// 📡 /api/market/quotes
//
// 사용자가 요청한 티커들(예: AAPL,TSLA,005930.KS)의 실시간 시세를 가져옵니다.
// =============================================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tickersStr = searchParams.get("tickers")

    if (!tickersStr) {
      return NextResponse.json({ error: "조회할 티커가 없습니다." }, { status: 400 })
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

    return NextResponse.json(quotes)
  } catch (err: any) {
    console.error("[market/quotes] 실패:", err.message)
    return NextResponse.json([], { status: 502 })
  }
}
