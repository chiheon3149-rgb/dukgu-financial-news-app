/**
 * app/api/stock/search/route.ts
 * ==============================
 * 한글 검색 → Supabase kr_stocks 테이블 조회
 * 영문/티커 검색 → 야후 파이낸스 API 호출
 */

import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import YahooFinanceClass from "yahoo-finance2"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinanceClass as any)()

// =============================================================================
// 거래소 코드 → 표시 이름
// =============================================================================
const EXCHANGE_LABEL: Record<string, string> = {
  KSC: "코스피",
  KOE: "코스닥",
  NMS: "나스닥",
  NYQ: "NYSE",
  NGM: "나스닥",
  PCX: "NYSE아카",
  ASE: "아멕스",
  TYO: "도쿄",
  HKG: "홍콩",
}

// =============================================================================
// 한글 여부 판별
// =============================================================================
function hasKorean(str: string): boolean {
  return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(str)
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createSupabaseServer()

  // ── 한글 검색: Supabase kr_stocks 조회 ──────────────────────────────────
  if (hasKorean(query)) {
    const { data, error } = await supabase
      .from("kr_stocks")
      .select("ticker, name, market")
      .ilike("name", `%${query}%`)
      .limit(8)

    if (error) {
      console.error("[API /stock/search] supabase error:", error.message)
      return NextResponse.json({ results: [] })
    }

    return NextResponse.json({
      results: (data ?? []).map((s) => ({
        ticker:   s.ticker,
        name:     s.name,
        exchange: s.market,
        isKorean: true,
      })),
    })
  }

  // ── 숫자 입력: 종목코드로 간주 → Supabase 조회 ──────────────────────────
  if (/^\d{5,6}$/.test(query)) {
    const { data } = await supabase
      .from("kr_stocks")
      .select("ticker, name, market")
      .ilike("ticker", `${query}%`)
      .limit(5)

    if (data && data.length > 0) {
      return NextResponse.json({
        results: data.map((s) => ({
          ticker:   s.ticker,
          name:     s.name,
          exchange: s.market,
          isKorean: true,
        })),
      })
    }

    // DB에 없으면 .KS 붙여서 반환
    return NextResponse.json({
      results: [{
        ticker:   `${query}.KS`,
        name:     `${query}.KS`,
        exchange: "코스피",
        isKorean: true,
      }],
    })
  }

  // ── 영문/티커 검색: 야후 파이낸스 API ───────────────────────────────────
  try {
    const searchResult = await yahooFinance.search(query, {
      newsCount:   0,
      quotesCount: 8,
    })

    const results = (searchResult.quotes ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.quoteType === "EQUITY" && q.symbol)
      .slice(0, 5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((q: any) => {
        const symbol   = q.symbol
        const exchange = q.exchange ?? ""
        const isKorean = symbol.endsWith(".KS") || symbol.endsWith(".KQ")

        return {
          ticker:   symbol,
          name:     q.longname ?? q.shortname ?? symbol,
          exchange: EXCHANGE_LABEL[exchange] ?? exchange,
          isKorean,
        }
      })

    return NextResponse.json({ results })

  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류"
    console.error("[API /stock/search]", message)
    return NextResponse.json({ results: [], error: message }, { status: 500 })
  }
}
