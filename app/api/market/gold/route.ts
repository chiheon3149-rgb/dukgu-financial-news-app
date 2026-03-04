import { NextResponse } from "next/server"
import { yahooFetch } from "@/lib/yahoo-finance"

// =============================================================================
// 📡 /api/market/gold
//
// 금 현물 가격을 가져옵니다.
// Yahoo Finance의 GC=F(금 선물)를 기준으로 달러 온스(troy oz) 가격을 받아
// 1g 기준 원화 가격으로 변환합니다.
//
// 변환 공식:
//   1 troy oz = 31.1035g
//   1g USD 가격 = GC=F 가격 / 31.1035
//   1g KRW 가격 = 1g USD × 원달러 환율 (환율도 KRW=X 티커로 함께 조회)
// =============================================================================

const TROY_OZ_TO_GRAM = 31.1035

export async function GET() {
  try {
    const quotes = await yahooFetch(["GC=F", "KRW=X"])

    const goldQuote = quotes.find((q: any) => q.symbol === "GC=F")
    const fxQuote   = quotes.find((q: any) => q.symbol === "KRW=X")

    if (!goldQuote) {
      return NextResponse.json({ error: "금 시세 조회 실패" }, { status: 502 })
    }

    const goldPriceUsdPerOz: number = goldQuote.regularMarketPrice ?? 0
    const usdToKrwRate: number      = fxQuote?.regularMarketPrice ?? 1360
    const goldChangePct: number     = goldQuote.regularMarketChangePercent ?? 0

    const pricePerGramUsd = goldPriceUsdPerOz / TROY_OZ_TO_GRAM
    const pricePerGramKrw = Math.round(pricePerGramUsd * usdToKrwRate)

    return NextResponse.json({
      pricePerGramUsd: Math.round(pricePerGramUsd * 100) / 100,
      pricePerGramKrw,
      usdToKrwRate,
      changeRate: goldChangePct,
      changeStatus: goldChangePct > 0 ? "up" : goldChangePct < 0 ? "down" : "same",
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[market/gold] 오류:", err)
    return NextResponse.json({ error: "금 시세 조회에 실패했습니다." }, { status: 502 })
  }
}
