import { NextResponse } from "next/server"

// =============================================================================
// 📡 /api/market/quotes
//
// 사용자가 요청한 티커들(예: AAPL,TSLA,005930.KS)의 실시간 시세를 가져옵니다.
// 보내주신 indices의 Crumb + Cookie 인증 방식을 그대로 적용했습니다.
// =============================================================================

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

// 인증 캐시
let _crumb: string | null = null
let _cookies: string | null = null
let _crumbAt = 0
const CRUMB_TTL_MS = 55 * 60 * 1000 

function parseCookies(raw: string): string {
  return raw
    .split(/,(?=[^;]+=[^;])/)
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
    headers: { "User-Agent": UA, "Accept": "*/*", "Cookie": cookies },
    cache: "no-store",
  })

  if (!crumbRes.ok) throw new Error(`crumb 요청 실패: ${crumbRes.status}`)
  const crumb = await crumbRes.text()
  
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

// 💡 실제 데이터를 가져오는 핵심 함수
async function fetchQuotes(tickers: string[], retried = false): Promise<any[]> {
  const { crumb, cookies } = await getCrumb()
  const symbolsParam = encodeURIComponent(tickers.join(","))
  
  // 지수 조회와 같은 v7/finance/quote 엔드포인트를 사용합니다.
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}&crumb=${encodeURIComponent(crumb)}`

  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "application/json, text/plain, */*",
      "Cookie": cookies,
      "Referer": "https://finance.yahoo.com/",
    },
    cache: "no-store",
  })

  if ((res.status === 401 || res.status === 403) && !retried) {
    _crumb = null
    return fetchQuotes(tickers, true)
  }

  if (!res.ok) throw new Error(`Yahoo Finance 응답 오류: ${res.status}`)

  const json = await res.json()
  const results = json?.quoteResponse?.result ?? []
  
  // 우리 앱에서 사용하는 형식으로 예쁘게 매핑
  return results.map((q: any) => ({
    ticker: q.symbol,
    name: q.shortName || q.longName || q.symbol,
    currentPrice: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    currency: q.currency,
  }))
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tickersStr = searchParams.get('tickers')

    if (!tickersStr) {
      return NextResponse.json({ error: '조회할 티커가 없습니다.' }, { status: 400 })
    }

    const tickers = tickersStr.split(',').map(t => t.trim().toUpperCase())
    const quotes = await fetchQuotes(tickers)

    return NextResponse.json(quotes)
  } catch (err: any) {
    console.error("[market/quotes] 실패:", err.message)
    return NextResponse.json([], { status: 502 })
  }
}