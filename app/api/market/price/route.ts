import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 📡 /api/market/price?tickers=AAPL,NVDA,005930.KS
//
// 왜 API Route를 프록시로 쓰는가?
// Yahoo Finance API를 브라우저에서 직접 호출하면 CORS 정책으로 막힙니다.
// Next.js 서버를 중간에 두면 서버↔서버 통신이므로 CORS 문제가 없고,
// 향후 유료 API 키로 교체할 때도 키가 클라이언트에 노출되지 않습니다.
//
// 향후 교체: 이 파일의 fetchFromYahoo 함수 내부만 교체하면
//           프론트엔드 코드를 건드리지 않고 데이터 소스를 바꿀 수 있습니다.
//           (예: Alpha Vantage, Finnhub, 한국투자증권 OpenAPI 등)
// =============================================================================

const YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote"

async function fetchFromYahoo(tickers: string[]) {
  const symbols = tickers.join(",")
  const url = `${YAHOO_QUOTE_URL}?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChangePercent,currency`

  const res = await fetch(url, {
    headers: {
      // Yahoo Finance는 브라우저처럼 보이는 User-Agent를 요구합니다
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept": "application/json",
    },
    // 30초 캐시: 같은 티커를 여러 컴포넌트에서 동시에 요청해도 서버에 한 번만 갑니다
    next: { revalidate: 30 },
  })

  if (!res.ok) {
    throw new Error(`Yahoo Finance 응답 오류: ${res.status}`)
  }

  const json = await res.json()
  return json?.quoteResponse?.result ?? []
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tickersParam = searchParams.get("tickers")

  if (!tickersParam) {
    return NextResponse.json({ error: "tickers 파라미터가 필요합니다" }, { status: 400 })
  }

  const tickers = tickersParam.split(",").map((t) => t.trim()).filter(Boolean)

  try {
    const quotes = await fetchFromYahoo(tickers)

    // 프론트엔드가 사용하기 편한 형태로 정제합니다
    const result = quotes.map((q: any) => ({
      ticker: q.symbol,
      currentPrice: q.regularMarketPrice ?? 0,
      currency: (q.currency ?? "USD") as "KRW" | "USD",
      changeRate: q.regularMarketChangePercent ?? 0,
      changeStatus:
        (q.regularMarketChangePercent ?? 0) > 0
          ? "up"
          : (q.regularMarketChangePercent ?? 0) < 0
          ? "down"
          : "same",
      fetchedAt: new Date().toISOString(),
    }))

    return NextResponse.json({ quotes: result })
  } catch (err) {
    console.error("[market/price] 오류:", err)
    return NextResponse.json(
      { error: "시세 조회에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    )
  }
}
