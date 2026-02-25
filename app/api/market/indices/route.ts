import { NextResponse } from "next/server"

// =============================================================================
// 📡 /api/market/indices
//
// 주요 글로벌 지수 시세를 Yahoo Finance에서 가져옵니다.
// Yahoo Finance crumb + cookie 인증 방식을 사용합니다.
//
// 인증 흐름:
//   1. fc.yahoo.com → 동의 쿠키(A3 등) 획득
//   2. /v1/test/getcrumb + 쿠키 → crumb 토큰 획득
//   3. /v7/finance/quote + crumb + 쿠키 → 지수 데이터 조회
//
// 지원 지수:
//   ^DJI, ^NDX, ^GSPC, ^RUT, ^KS11, ^KQ11, KRW=X
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
  "JPYKRW=X": "엔/원",  // 👈 이 줄을 추가하세요!
  "^IXIC": "나스닥",
  "^VIX":  "VIX",
  "^TNX":  "미국10년물",
}

const SYMBOLS = ["^DJI", "^NDX", "^GSPC", "^RUT", "^KS11", "^KQ11", "KRW=X", "JPYKRW=X"]

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

// =============================================================================
// Crumb 캐시 — 모듈 레벨 in-memory (cold start 시 초기화)
// =============================================================================

let _crumb: string | null = null
let _cookies: string | null = null
let _crumbAt = 0
const CRUMB_TTL_MS = 55 * 60 * 1000 // 55분 (Yahoo 세션은 1시간)

function parseCookies(raw: string): string {
  // "Set-Cookie: key=val; Path=/; ..., key2=val2; ..."
  return raw
    .split(/,(?=[^;]+=[^;])/)       // 쿠키 경계 분리
    .map(c => c.trim().split(";")[0].trim())
    .filter(Boolean)
    .join("; ")
}

async function refreshCrumb(): Promise<void> {
  // Step 1: fc.yahoo.com → 동의 쿠키 획득
  const consentRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA, "Accept": "*/*" },
    redirect: "follow",
  })

  const rawCookie = consentRes.headers.get("set-cookie") ?? ""
  const cookies = parseCookies(rawCookie)

  if (!cookies) throw new Error("Yahoo 쿠키 획득 실패")

  // Step 2: crumb 토큰 획득
  const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
    headers: {
      "User-Agent": UA,
      "Accept": "*/*",
      "Cookie": cookies,
    },
    cache: "no-store",
  })

  if (!crumbRes.ok) throw new Error(`crumb 요청 실패: ${crumbRes.status}`)

  const crumb = await crumbRes.text()
  if (!crumb || crumb.startsWith("<") || crumb.length > 20) {
    throw new Error(`crumb 파싱 실패: ${crumb.slice(0, 50)}`)
  }

  _crumb = crumb
  _cookies = cookies
  _crumbAt = Date.now()
}

async function getCrumb(): Promise<{ crumb: string; cookies: string }> {
  if (_crumb && _cookies && Date.now() - _crumbAt < CRUMB_TTL_MS) {
    return { crumb: _crumb, cookies: _cookies }
  }
  await refreshCrumb()
  return { crumb: _crumb!, cookies: _cookies! }
}

// =============================================================================
// 데이터 조회
// =============================================================================

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

async function fetchIndices(retried = false): Promise<IndexQuote[]> {
  const { crumb, cookies } = await getCrumb()

  const symbolsParam = encodeURIComponent(SYMBOLS.join(","))
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}&crumb=${encodeURIComponent(crumb)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent`

  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
      "Cookie": cookies,
      "Referer": "https://finance.yahoo.com/",
    },
    cache: "no-store",
  })

  // crumb 만료 시 한 번 재시도
  if ((res.status === 401 || res.status === 403) && !retried) {
    _crumb = null
    _cookies = null
    return fetchIndices(true)
  }

  if (!res.ok) throw new Error(`Yahoo Finance 응답 오류: ${res.status}`)

  const json = await res.json()
  const results: any[] = json?.quoteResponse?.result ?? []
  if (results.length === 0) throw new Error("빈 결과")

  return results.map(mapResult)
}

export async function GET() {
  try {
    const indices = await fetchIndices()
    return NextResponse.json({ indices, source: "live", fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.warn("[market/indices] 실패:", err)
    return NextResponse.json({ indices: [], source: "error", fetchedAt: new Date().toISOString() }, { status: 502 })
  }
}
