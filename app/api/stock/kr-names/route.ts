import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

// GET /api/stock/kr-names?tickers=005930.KS,000660.KS,069500.KS
// 1차: kr_stocks 테이블 (주식/ETF 통합) 조회
// 2차: kr_stock_names 테이블 (6자리 코드 기반) fallback 조회
export async function GET(req: NextRequest) {
  const tickersStr = req.nextUrl.searchParams.get("tickers") ?? ""
  if (!tickersStr) return NextResponse.json({})

  const tickers = tickersStr.split(",").map((t) => t.trim()).filter(Boolean)
  const krTickers = tickers.filter((t) => t.endsWith(".KS") || t.endsWith(".KQ"))
  if (krTickers.length === 0) return NextResponse.json({})

  const supabase = await createSupabaseServer()
  const map: Record<string, string> = {}

  // 1차: kr_stocks 테이블 (ticker = '005930.KS' 형식)
  const { data: stocks } = await supabase
    .from("kr_stocks")
    .select("ticker, name")
    .in("ticker", krTickers)

  ;(stocks ?? []).forEach((r) => { map[r.ticker] = r.name })

  // 2차: 아직 매핑 안 된 티커는 kr_stock_names 에서 6자리 코드로 조회
  const missing = krTickers.filter((t) => !map[t])
  if (missing.length > 0) {
    const codes = missing.map((t) => t.split(".")[0])
    const { data: etfs } = await supabase
      .from("kr_stock_names")
      .select("code, name")
      .in("code", codes)

    ;(etfs ?? []).forEach((r) => {
      // code '069500' → 원래 티커 '069500.KS' 로 매핑
      const original = missing.find((t) => t.startsWith(r.code + "."))
      if (original) map[original] = r.name
    })
  }

  return NextResponse.json(map)
}
