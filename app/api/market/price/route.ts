import { NextRequest, NextResponse } from "next/server"
import { yahooFetch } from "@/lib/yahoo-finance"

// =============================================================================
// 📡 /api/market/price?tickers=AAPL,NVDA,005930.KS
//
// 흐름:
//   1. Yahoo Finance API 호출 시도 (crumb 인증 포함)
//   2. 실패(네트워크 차단, 429 등) → Mock 데이터로 폴백
//
// 운영 환경에서는 실제 시세가 내려오고,
// 개발 환경처럼 외부 네트워크가 막혀 있으면 Mock 시세로 자동 대체됩니다.
// =============================================================================

// 개발 / 네트워크 차단 환경용 Mock 시세
const MOCK_PRICES: Record<string, { price: number; changeRate: number; currency: "KRW" | "USD" }> = {
  "AAPL":       { price: 227.52,   changeRate:  1.23, currency: "USD" },
  "NVDA":       { price: 137.80,   changeRate:  2.81, currency: "USD" },
  "MSFT":       { price: 415.32,   changeRate: -0.54, currency: "USD" },
  "QQQ":        { price: 488.90,   changeRate:  0.97, currency: "USD" },
  "SCHD":       { price: 29.15,    changeRate:  0.22, currency: "USD" },
  "QYLD":       { price: 16.82,    changeRate: -0.12, currency: "USD" },
  "005930.KS":  { price: 62800,    changeRate:  0.48, currency: "KRW" },
  "035720.KS":  { price: 44500,    changeRate: -1.11, currency: "KRW" },
}

function buildMockQuotes(tickers: string[]) {
  return tickers.map((ticker) => {
    const mock = MOCK_PRICES[ticker] ?? { price: 100, changeRate: 0, currency: "USD" as const }
    return {
      ticker,
      currentPrice: mock.price,
      currency: mock.currency,
      changeRate: mock.changeRate,
      changeStatus: mock.changeRate > 0 ? "up" : mock.changeRate < 0 ? "down" : "same",
      fetchedAt: new Date().toISOString(),
      isMock: true,
    }
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tickersParam = searchParams.get("tickers")

  if (!tickersParam) {
    return NextResponse.json({ error: "tickers 파라미터가 필요합니다" }, { status: 400 })
  }

  const tickers = tickersParam.split(",").map((t) => t.trim()).filter(Boolean)

  try {
    const raw = await yahooFetch(tickers)
    const quotes = raw.map((q: any) => ({
      ticker: q.symbol,
      currentPrice: q.regularMarketPrice ?? 0,
      currency: (q.currency ?? "USD") as "KRW" | "USD",
      changeRate: q.regularMarketChangePercent ?? 0,
      changeStatus:
        (q.regularMarketChangePercent ?? 0) > 0 ? "up" :
        (q.regularMarketChangePercent ?? 0) < 0 ? "down" : "same",
      fetchedAt: new Date().toISOString(),
    }))
    return NextResponse.json({ quotes })
  } catch (err) {
    console.warn("[market/price] Yahoo Finance 실패, Mock 데이터로 폴백:", err)
    return NextResponse.json({ quotes: buildMockQuotes(tickers), source: "mock" })
  }
}
