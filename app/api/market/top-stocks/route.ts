import { NextResponse } from "next/server"
import { yahooFetch, yahooTrending } from "@/lib/yahoo-finance"

// =============================================================================
// 📡 /api/market/top-stocks
//
// 한국/미국 트렌딩 종목의 실시간 시세를 반환합니다.
// Yahoo Finance Trending API로 인기 순위를 가져온 뒤,
// v7 quote API로 가격/거래량/등락률/거래대금을 조회합니다.
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
  tradingValue: number // volume × price (거래대금)
}

// 한국 종목 이름 매핑 (Yahoo shortName 대신 한국어 이름 표시용)
const KR_NAMES: Record<string, string> = {
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
  "051910.KS": "LG화학",
  "032830.KS": "삼성생명",
  "003550.KS": "LG",
  "017670.KS": "SK텔레콤",
  "030200.KS": "KT",
  "055550.KS": "신한지주",
  "105560.KS": "KB금융",
  "086790.KS": "하나금융지주",
  "096770.KS": "SK이노베이션",
  "034020.KS": "두산에너빌리티",
  "000810.KS": "삼성화재",
  "326030.KS": "SK바이오팜",
  "003670.KS": "포스코퓨처엠",
}

// 미국 종목 이름 매핑 (fallback용)
const US_NAMES: Record<string, string> = {
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
  "AVGO":  "브로드컴",
  "UNH":   "유나이티드헬스",
  "XOM":   "엑슨모빌",
  "MA":    "마스터카드",
  "HD":    "홈디포",
}

// 기본 fallback 목록 (Trending API 실패 시)
const KR_FALLBACK = Object.keys(KR_NAMES).slice(0, 10)
const US_FALLBACK = Object.keys(US_NAMES).slice(0, 10)

function toDisplayTicker(ticker: string): string {
  return ticker.replace(/\.(KS|KQ)$/, "")
}

// 코인/암호화폐 심볼 필터: BTC-USD, ETH-KRW 등 제외
function isCrypto(symbol: string): boolean {
  return /-(USD|KRW|BTC|ETH|USDT|USDC)$/i.test(symbol)
}

function mapToTopStock(
  raw: Record<string, unknown>,
  nameMap: Record<string, string>,
  currency: "KRW" | "USD"
): TopStock {
  const ticker = String(raw.symbol ?? "")
  const price = Number(raw.regularMarketPrice ?? 0)
  const volume = Number(raw.regularMarketVolume ?? 0)
  return {
    ticker,
    displayTicker: toDisplayTicker(ticker),
    name: nameMap[ticker] ?? String(raw.shortName ?? ticker),
    changeRate: Number(raw.regularMarketChangePercent ?? 0),
    price,
    currency,
    volume,
    tradingValue: volume * price, // 거래대금 = 거래량 × 가격
  }
}

// 서버 인스턴스 내 15분 캐시
const CACHE_TTL = 15 * 60 * 1000
let _cache: { data: object; at: number } | null = null

export async function GET() {
  // 캐시 유효하면 즉시 반환
  if (_cache && Date.now() - _cache.at < CACHE_TTL) {
    return NextResponse.json(_cache.data)
  }

  try {
    // 1단계: Trending 종목 목록 가져오기 (인기 순서)
    const [krTrending, usTrending] = await Promise.allSettled([
      yahooTrending("KR", 15),
      yahooTrending("US", 15),
    ])

    const krSymbols =
      krTrending.status === "fulfilled" && krTrending.value.length > 0
        ? krTrending.value.filter((s) => !isCrypto(s)).slice(0, 10)
        : KR_FALLBACK

    const usSymbols =
      usTrending.status === "fulfilled" && usTrending.value.length > 0
        ? usTrending.value.filter((s) => !isCrypto(s)).slice(0, 10)
        : US_FALLBACK

    // 2단계: Quote 데이터 조회
    const [krRaw, usRaw] = await Promise.all([
      yahooFetch(krSymbols),
      yahooFetch(usSymbols),
    ])

    const krList = (Array.isArray(krRaw) ? krRaw : [krRaw]) as Record<string, unknown>[]
    const usList = (Array.isArray(usRaw) ? usRaw : [usRaw]) as Record<string, unknown>[]

    // 3단계: Trending 순서 유지 (인기 탭 정렬 기준)
    const krOrdered = krSymbols
      .map((sym) => krList.find((q) => q.symbol === sym))
      .filter(Boolean) as Record<string, unknown>[]

    const usOrdered = usSymbols
      .map((sym) => usList.find((q) => q.symbol === sym))
      .filter(Boolean) as Record<string, unknown>[]

    const kr: TopStock[] = krOrdered.map((q) => mapToTopStock(q, KR_NAMES, "KRW"))
    const us: TopStock[] = usOrdered.map((q) => mapToTopStock(q, US_NAMES, "USD"))

    const payload = { kr, us, fetchedAt: new Date().toISOString() }
    _cache = { data: payload, at: Date.now() }
    return NextResponse.json(payload)
  } catch (err) {
    console.warn("[market/top-stocks] 실패:", err)
    return NextResponse.json(
      { kr: [], us: [], fetchedAt: new Date().toISOString(), error: true },
      { status: 502 }
    )
  }
}
