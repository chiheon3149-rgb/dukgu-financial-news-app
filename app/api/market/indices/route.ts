import { NextResponse } from "next/server"

// =============================================================================
// 📡 /api/market/indices
//
// 주요 글로벌 지수 시세를 Yahoo Finance에서 가져옵니다.
// 실패 시 Mock 데이터로 자동 폴백합니다.
//
// 지원 지수 (SYMBOLS 배열에 추가하면 자동 확장):
//   ^DJI     — 다우존스 산업평균
//   ^NDX     — 나스닥 100
//   ^GSPC    — S&P 500
//   ^RUT     — 러셀 2000
//   ^KS11    — 코스피
//   ^KQ11    — 코스닥
//   KRW=X    — 달러/원 환율
// =============================================================================

export interface IndexQuote {
  symbol: string
  name: string
  price: number
  change: number
  changeRate: number
  changeStatus: "up" | "down" | "same"
}

const INDEX_META: Record<string, string> = {
  "^DJI":  "다우존스",
  "^NDX":  "나스닥100",
  "^GSPC": "S&P500",
  "^RUT":  "러셀2000",
  "^KS11": "코스피",
  "^KQ11": "코스닥",
  "KRW=X": "USD/KRW",
  "^IXIC": "나스닥",
  "^VIX":  "VIX",
  "^TNX":  "미국10년물",
}

const SYMBOLS = ["^DJI", "^NDX", "^GSPC", "^RUT", "^KS11", "^KQ11", "KRW=X"]

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Origin": "https://finance.yahoo.com",
  "Referer": "https://finance.yahoo.com/",
}

const MOCK_INDICES: IndexQuote[] = [
  { symbol: "^DJI",  name: "다우존스",  price: 43461.21, change:  305.12, changeRate:  0.71, changeStatus: "up"   },
  { symbol: "^NDX",  name: "나스닥100", price: 21340.50, change: -180.30, changeRate: -0.84, changeStatus: "down" },
  { symbol: "^GSPC", name: "S&P500",   price:  5963.10, change:   42.15, changeRate:  0.71, changeStatus: "up"   },
  { symbol: "^RUT",  name: "러셀2000", price:  2210.45, change:  -12.30, changeRate: -0.55, changeStatus: "down" },
  { symbol: "^KS11", name: "코스피",   price:  2535.20, change:   18.40, changeRate:  0.73, changeStatus: "up"   },
  { symbol: "^KQ11", name: "코스닥",   price:   720.15, change:   -3.25, changeRate: -0.45, changeStatus: "down" },
  { symbol: "KRW=X", name: "USD/KRW", price:  1432.50, change:    2.30, changeRate:  0.16, changeStatus: "up"   },
]

function mapResult(q: any): IndexQuote {
  const rate: number = q.regularMarketChangePercent ?? 0
  return {
    symbol: q.symbol,
    name: INDEX_META[q.symbol] ?? q.shortName ?? q.symbol,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changeRate: rate,
    changeStatus: rate > 0 ? "up" : rate < 0 ? "down" : "same",
  }
}

async function fetchFromDomain(domain: string): Promise<IndexQuote[]> {
  const symbolsParam = encodeURIComponent(SYMBOLS.join(","))
  const url = `https://${domain}/v7/finance/quote?symbols=${symbolsParam}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent`

  const res = await fetch(url, {
    headers: YAHOO_HEADERS,
    next: { revalidate: 30 },
  })

  if (!res.ok) throw new Error(`${domain} 응답 오류: ${res.status}`)

  const json = await res.json()
  const results: any[] = json?.quoteResponse?.result ?? []
  if (results.length === 0) throw new Error(`${domain} 빈 결과`)

  return results.map(mapResult)
}

async function fetchIndices(): Promise<IndexQuote[]> {
  // query1 먼저 시도, 실패 시 query2로 폴백
  try {
    return await fetchFromDomain("query1.finance.yahoo.com")
  } catch {
    return await fetchFromDomain("query2.finance.yahoo.com")
  }
}

export async function GET() {
  try {
    const indices = await fetchIndices()
    return NextResponse.json({ indices, source: "live", fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.warn("[market/indices] Yahoo Finance 실패, Mock 폴백:", err)
    return NextResponse.json({ indices: MOCK_INDICES, source: "mock", fetchedAt: new Date().toISOString() })
  }
}
