import { NextRequest, NextResponse } from "next/server"
import { yahooSearch } from "@/lib/yahoo-finance"

// =============================================================================
// 🔍 /api/market/search — Yahoo Finance 종목 검색 프록시
//
// 브라우저에서 Yahoo Finance search API를 직접 호출하면 CORS 오류가 발생합니다.
// 서버사이드에서 호출해 결과를 전달함으로써 CORS 문제를 우회합니다.
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q) {
    return NextResponse.json({ quotes: [] })
  }

  try {
    const allQuotes = await yahooSearch(q)

    // 주식(Equity)과 ETF 필터링 (대소문자 무관, 국내외 다양한 typeDisp 대응)
    const ALLOWED_TYPES = ["equity", "etf", "fund"]
    const quotes = allQuotes
      .filter((q: any) => {
        const t = (q.typeDisp ?? q.quoteType ?? "").toLowerCase()
        return ALLOWED_TYPES.some(a => t.includes(a))
      })
      .map((q: any) => ({
        symbol: q.symbol,
        shortname: q.shortname ?? q.longname ?? q.symbol,
        exchDisp: q.exchDisp ?? "",
        typeDisp: q.typeDisp ?? q.quoteType ?? "",
      }))

    return NextResponse.json({ quotes })
  } catch (err) {
    console.error("[market/search] 오류:", err)
    return NextResponse.json(
      { quotes: [], error: "검색 중 오류가 발생했습니다." },
      { status: 200 }
    )
  }
}
