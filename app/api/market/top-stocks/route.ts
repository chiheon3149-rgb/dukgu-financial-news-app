import { NextResponse } from "next/server"
import { yahooFetch } from "@/lib/yahoo-finance"

// =============================================================================
// 📡 /api/market/top-stocks
//
// 한국/미국 인기 종목의 실시간 시세를 반환합니다.
// Yahoo Finance v7 API를 통해 가격, 등락률, 거래량, 시가총액을 조회합니다.
//
// 응답: { kr: TopStock[], us: TopStock[], fetchedAt: string }
// =============================================================================

export interface TopStock {
  ticker: string
  displayTicker: string
  name: string
  changeRate: number
  price: number
  currency: "KRW" | "USD"
  volume: number
  marketCap: number
}

// 한국 종목: 티커 → 한국어 이름
const KR_TICKERS: Record<string, string> = {
  "005930.KS": "삼성전자",
  "000660.KS": "SK하이닉스",
  "373220.KS": "LG에너지솔루션",
  "207940.KS": "삼성바이오로직스",
  "005380.KS": "현대차",
  "035420.KS": "NAVER",
  "035720.KS": "카카오",
  "066570.KS": "LG전자",
  "068270.KS": "셀트리온",
  "000270.KS": "기아",
  "012330.KS": "현대모비스",
  "028260.KS": "삼성물산",
}

// 미국 종목: 티커 → 한국어 이름
const US_TICKERS: Record<string, string> = {
  "AAPL":  "애플",
  "MSFT":  "마이크로소프트",
  "NVDA":  "엔비디아",
  "GOOGL": "알파벳",
  "AMZN":  "아마존",
  "META":  "메타",
  "TSLA":  "테슬라",
  "JPM":   "JP모건",
  "LLY":   "일라이릴리",
  "V":     "비자",
}

// .KS / .KQ 접미사 제거하여 displayTicker 생성
function toDisplayTicker(ticker: string): string {
  return ticker.replace(/\.(KS|KQ)$/, "")
}

// Yahoo Finance 원시 응답 → TopStock 변환
function mapToTopStock(
  raw: Record<string, unknown>,
  nameMap: Record<string, string>,
  currency: "KRW" | "USD"
): TopStock {
  const ticker = String(raw.symbol ?? "")
  return {
    ticker,
    displayTicker: toDisplayTicker(ticker),
    name: nameMap[ticker] ?? String(raw.shortName ?? ticker),
    changeRate: Number(raw.regularMarketChangePercent ?? 0),
    price: Number(raw.regularMarketPrice ?? 0),
    currency,
    volume: Number(raw.regularMarketVolume ?? 0),
    marketCap: Number(raw.marketCap ?? 0),
  }
}

export async function GET() {
  const krSymbols = Object.keys(KR_TICKERS)
  const usSymbols = Object.keys(US_TICKERS)

  try {
    // KR / US 병렬 조회
    const [krRaw, usRaw] = await Promise.all([
      yahooFetch(krSymbols),
      yahooFetch(usSymbols),
    ])

    // 결과가 단일 객체인 경우 배열로 감싸기
    const krList = (Array.isArray(krRaw) ? krRaw : [krRaw]) as Record<string, unknown>[]
    const usList = (Array.isArray(usRaw) ? usRaw : [usRaw]) as Record<string, unknown>[]

    const kr: TopStock[] = krList.map((q) => mapToTopStock(q, KR_TICKERS, "KRW"))
    const us: TopStock[] = usList.map((q) => mapToTopStock(q, US_TICKERS, "USD"))

    return NextResponse.json({ kr, us, fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.warn("[market/top-stocks] Yahoo Finance 실패:", err)
    return NextResponse.json(
      { kr: [], us: [], fetchedAt: new Date().toISOString(), error: true },
      { status: 502 }
    )
  }
}
