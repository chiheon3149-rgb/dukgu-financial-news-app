// =============================================================================
// 📡 Supabase Edge Function: fetch-market-indices
//
// Yahoo Finance에서 글로벌 주요 지수를 가져와 market_indices 테이블에 upsert합니다.
// pg_cron에 의해 1분마다 자동 호출됩니다.
//
// 배포 방법:
//   supabase functions deploy fetch-market-indices
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

const INDEX_META: Record<string, string> = {
  "^DJI":  "다우존스",
  "^NDX":  "나스닥100",
  "^GSPC": "S&P500",
  "^RUT":  "러셀2000",
  "^KS11": "코스피",
  "^KQ11": "코스닥",
  "KRW=X": "USD/KRW",
  "JPYKRW=X": "엔/원",  // 👈 이 줄을 추가하세요!
}

const SYMBOLS = ["^DJI", "^NDX", "^GSPC", "^RUT", "^KS11", "^KQ11", "KRW=X", "JPYKRW=X"]

// Set-Cookie 헤더를 단일 Cookie 문자열로 파싱
function parseCookies(raw: string): string {
  return raw
    .split(/,(?=[^;]+=[^;])/)
    .map((c: string) => c.trim().split(";")[0].trim())
    .filter(Boolean)
    .join("; ")
}

// Yahoo Finance crumb 인증 후 지수 데이터 fetch
async function fetchFromYahoo() {
  // Step 1: fc.yahoo.com → 동의 쿠키 획득
  const consentRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA, "Accept": "*/*" },
    redirect: "follow",
  })
  const rawCookie = consentRes.headers.get("set-cookie") ?? ""
  const cookies = parseCookies(rawCookie)
  if (!cookies) throw new Error("Yahoo 쿠키 획득 실패")

  // Step 2: crumb 토큰 획득
  const crumbRes = await fetch(
    "https://query2.finance.yahoo.com/v1/test/getcrumb",
    { headers: { "User-Agent": UA, "Accept": "*/*", "Cookie": cookies } }
  )
  if (!crumbRes.ok) throw new Error(`crumb 요청 실패: ${crumbRes.status}`)
  const crumb = await crumbRes.text()
  if (!crumb || crumb.startsWith("<") || crumb.length > 20) {
    throw new Error(`crumb 파싱 오류: ${crumb.slice(0, 50)}`)
  }

  // Step 3: 지수 데이터 조회
  const symbolsParam = encodeURIComponent(SYMBOLS.join(","))
  const url =
    `https://query2.finance.yahoo.com/v7/finance/quote` +
    `?symbols=${symbolsParam}` +
    `&crumb=${encodeURIComponent(crumb)}` +
    `&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent`

  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "application/json",
      "Cookie": cookies,
      "Referer": "https://finance.yahoo.com/",
    },
  })
  if (!res.ok) throw new Error(`Yahoo Finance 응답 오류: ${res.status}`)

  const json = await res.json()
  const results: any[] = json?.quoteResponse?.result ?? []
  if (!results.length) throw new Error("빈 응답 — 장 마감 후일 수 있습니다")

  const now = new Date().toISOString()
  return results.map((q: any) => {
    const rate = q.regularMarketChangePercent ?? 0
    return {
      symbol:        q.symbol,
      name:          INDEX_META[q.symbol] ?? q.shortName ?? q.symbol,
      price:         q.regularMarketPrice ?? 0,
      change:        q.regularMarketChange ?? 0,
      change_rate:   rate,
      change_status: rate > 0 ? "up" : rate < 0 ? "down" : "same",
      updated_at:    now,
    }
  })
}

// Edge Function 진입점
Deno.serve(async (_req: Request) => {
  try {
    // SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 Edge Function 환경에 자동 주입됩니다.
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    )

    const indices = await fetchFromYahoo()

    const { error } = await client
      .from("market_indices")
      .upsert(indices, { onConflict: "symbol" })

    if (error) throw error

    console.log(`[fetch-market-indices] ${indices.length}개 지수 업데이트 완료`)

    return new Response(
      JSON.stringify({ ok: true, updated: indices.length, at: new Date().toISOString() }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("[fetch-market-indices] 오류:", err)
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
