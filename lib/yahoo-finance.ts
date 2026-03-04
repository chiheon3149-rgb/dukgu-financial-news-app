// =============================================================================
// 🔑 Yahoo Finance 공통 인증 유틸
//
// Yahoo Finance v7 API는 crumb + cookie 인증이 필요합니다.
// 이 모듈은 crumb을 캐시하고 모든 마켓 API 라우트에서 공유합니다.
// =============================================================================

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

let _crumb: string | null = null
let _cookies: string | null = null
let _crumbAt = 0
const CRUMB_TTL_MS = 55 * 60 * 1000 // 55분

function parseCookies(raw: string): string {
  return raw
    .split(/,(?=[^;]+=[^;])/)
    .map((c) => c.trim().split(";")[0].trim())
    .filter(Boolean)
    .join("; ")
}

async function refreshCrumb(): Promise<void> {
  const consentRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA, "Accept": "*/*" },
    redirect: "follow",
  })

  const rawCookie = consentRes.headers.get("set-cookie") ?? ""
  const cookies = parseCookies(rawCookie)
  if (!cookies) throw new Error("Yahoo 쿠키 획득 실패")

  const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": UA, "Accept": "*/*", "Cookie": cookies },
    cache: "no-store",
  })

  if (!crumbRes.ok) throw new Error(`crumb 요청 실패: ${crumbRes.status}`)

  _crumb = await crumbRes.text()
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

/**
 * Yahoo Finance v7 quote API 공통 호출 함수
 * crumb 인증 포함, 401/403 시 자동 재시도
 */
export async function yahooFetch(symbols: string[], retried = false): Promise<any[]> {
  const { crumb, cookies } = await getCrumb()
  const symbolsParam = encodeURIComponent(symbols.join(","))
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
    return yahooFetch(symbols, true)
  }

  if (!res.ok) throw new Error(`Yahoo Finance 응답 오류: ${res.status}`)

  const json = await res.json()
  return json?.quoteResponse?.result ?? []
}

/**
 * Yahoo Finance 검색 API (crumb 불필요)
 */
export async function yahooSearch(query: string): Promise<any[]> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false`

  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept": "application/json" },
    next: { revalidate: 5 },
  })

  if (!res.ok) throw new Error(`Yahoo Finance 검색 오류: ${res.status}`)
  const data = await res.json()
  return data?.quotes ?? []
}
