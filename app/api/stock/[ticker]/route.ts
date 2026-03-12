/**
 * app/api/stock/[ticker]/route.ts
 * ================================
 * 💡 이 파일은 야후 파이낸스에서 주식 데이터를 직접 가져오는 API예요.
 *    Python 없이 JavaScript(Node.js)에서 바로 실행되기 때문에
 *    Vercel 등 어느 서버에서도 문제없이 동작해요!
 *
 *    브라우저 → GET /api/stock/AAPL → yahoo-finance2 → 야후 파이낸스
 *
 * 사용 예시:
 *   fetch("/api/stock/AAPL")
 *   fetch("/api/stock/005930.KS")   ← 한국 주식
 */

import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

// =============================================================================
// 🔧 숫자 포맷 헬퍼
// 💡 Python의 _fmt_market_cap, _fmt_volume 등과 동일한 역할을 해요.
//    숫자를 사람이 읽기 좋은 문자열로 변환해줘요.
// =============================================================================

function fmtMarketCap(v: number | null | undefined): string {
  if (v == null) return "-"
  if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(1)}조`
  if (v >= 100_000_000)       return `${Math.floor(v / 100_000_000)}억`
  return v.toLocaleString()
}

function fmtVolume(v: number | null | undefined): string {
  if (v == null) return "-"
  if (v >= 10_000) return `${Math.floor(v / 10_000).toLocaleString()}만주`
  return `${v.toLocaleString()}주`
}

function fmtPer(v: number | null | undefined): string {
  if (v == null) return "-"
  return `${v.toFixed(1)}배`
}

function fmtYield(v: number | null | undefined): string {
  if (v == null) return "-"
  // yahoo-finance2는 배당수익률을 소수(0.005 = 0.5%)로 줘요
  return `${(v * 100).toFixed(2)}%`
}

function fmtPrice(v: number | null | undefined, currency: string): string {
  if (v == null) return "-"
  if (currency === "KRW") return `${Math.round(v).toLocaleString()}원`
  return `$${v.toFixed(2)}`
}

function fmtDate(epochSec: number | null | undefined): string {
  if (epochSec == null) return "-"
  const d = new Date(epochSec * 1000)
  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월 ${String(d.getDate()).padStart(2, "0")}일`
}

// =============================================================================
// 🚀 GET /api/stock/[ticker]
// =============================================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params

  // 💡 티커 코드 보안 검사 — 알파벳·숫자·점·하이픈만 허용해요
  const sanitized = ticker.replace(/[^a-zA-Z0-9.\-]/g, "").toUpperCase()
  if (!sanitized) {
    return NextResponse.json({ error: true, message: "유효하지 않은 티커 코드예요." }, { status: 400 })
  }

  try {
    // ── 회사 정보(quote) 가져오기 ─────────────────────────────────────────
    // 💡 quote()는 야후 파이낸스의 '회사 명함' 서랍장을 여는 것과 같아요.
    //    현재가, 등락률, PER, 시가총액 등 거의 모든 정보가 들어있어요.
    const quote = await yahooFinance.quote(sanitized)

    // 유효하지 않은 종목 코드 처리
    if (!quote || !quote.quoteType) {
      return NextResponse.json(
        { error: true, ticker: sanitized, message: `'${sanitized}'는 존재하지 않거나 지원하지 않는 종목이에요.` },
        { status: 404 }
      )
    }

    // ── 회사 상세 정보(quoteSummary) 가져오기 ────────────────────────────
    // 💡 quoteSummary()는 '회사 소개 팜플렛 전체'를 펼치는 것과 같아요.
    //    assetProfile: CEO·설명·업종, summaryDetail: 배당·52주 고저 등
    let profile_extra: {
      summary: string
      ceo: string
      industry: string
      listing_date: string
    } = { summary: "정보 없음", ceo: "-", industry: "-", listing_date: "-" }

    try {
      const summary = await yahooFinance.quoteSummary(sanitized, {
        modules: ["assetProfile", "summaryDetail"],
      })

      const ap = summary.assetProfile
      if (ap) {
        profile_extra.summary  = ap.longBusinessSummary ?? "정보 없음"
        profile_extra.industry = ap.industry            ?? "-"

        // CEO: companyOfficers 중 title에 "CEO"가 포함된 분
        const officers = ap.companyOfficers ?? []
        const ceoObj   = officers.find((o) => o.title?.includes("CEO")) ?? officers[0]
        profile_extra.ceo = ceoObj?.name ?? "-"
      }
    } catch {
      // quoteSummary 실패해도 기본 정보는 계속 반환해요
    }

    // ── 상장일 변환 ───────────────────────────────────────────────────────
    // 💡 firstTradeDateMilliseconds: 밀리초 단위 타임스탬프예요 (÷1000 해서 초로 변환)
    const ftms = (quote as any).firstTradeDateMilliseconds
    profile_extra.listing_date = ftms ? fmtDate(Math.floor(ftms / 1000)) : "-"

    // ── 통화 & 등락 정보 ─────────────────────────────────────────────────
    const currency      = quote.currency ?? "USD"
    const currentPrice  = quote.regularMarketPrice ?? null
    const prevClose     = quote.regularMarketPreviousClose ?? null
    const changeAmount  = quote.regularMarketChange ?? 0
    // regularMarketChangePercent는 이미 % 값이에요 (예: 1.53 = 1.53%)
    const changeRate    = quote.regularMarketChangePercent ?? 0

    // ── 최종 profile 객체 조립 ────────────────────────────────────────────
    // 💡 이 객체가 프론트엔드 StockDetailPage에 전달되는 '완성된 도시락통'이에요!
    const profile = {
      name:                 quote.longName ?? quote.shortName ?? sanitized,
      currency,
      exchange:             quote.exchange              ?? "-",
      sector:               (quote as any).sector       ?? "-",
      industry:             profile_extra.industry,
      country:              (quote as any).country      ?? "-",
      website:              (quote as any).website      ?? "-",
      full_time_employees:  (quote as any).fullTimeEmployees ?? null,

      summary:              profile_extra.summary,
      ceo:                  profile_extra.ceo,
      listing_date:         profile_extra.listing_date,

      // ★ 현재가 & 등락 (프론트 메인 숫자)
      current_price:        currentPrice,
      change_amount:        parseFloat(changeAmount.toFixed(4)),
      change_rate:          parseFloat(changeRate.toFixed(4)),
      prev_close:           prevClose,

      // 지표 (포맷된 문자열)
      market_cap_fmt:       fmtMarketCap(quote.marketCap),
      per_fmt:              fmtPer((quote as any).trailingPE ?? (quote as any).forwardPE),
      dividend_yield_fmt:   fmtYield((quote as any).dividendYield),
      "52w_high_fmt":       fmtPrice(quote.fiftyTwoWeekHigh, currency),
      "52w_low_fmt":        fmtPrice(quote.fiftyTwoWeekLow,  currency),
      volume_fmt:           fmtVolume(quote.regularMarketVolume),
    }

    // ── 1년치 일별 차트 데이터 ───────────────────────────────────────────
    // 💡 chart()는 '주가 일기장 1년치'를 꺼내는 작업이에요.
    //    날짜(date)와 종가(close)만 깔끔하게 뽑아요.
    let chart_data: { date: string; close: number }[] = []
    try {
      const hist = await yahooFinance.chart(sanitized, {
        period1:  new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1년 전
        period2:  new Date(),
        interval: "1d",
      })

      chart_data = (hist.quotes ?? [])
        .filter((q) => q.close != null)
        .map((q) => ({
          date:  q.date.toISOString().slice(0, 10),   // "2025-03-12"
          close: parseFloat((q.close as number).toFixed(4)),
        }))
    } catch {
      // 차트 데이터 실패해도 profile은 정상 반환
    }

    return NextResponse.json({
      error:      false,
      ticker:     sanitized,
      fetched_at: new Date().toISOString(),
      profile,
      chart_data,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류"
    console.error(`[API /stock/${sanitized}]`, message)

    return NextResponse.json(
      { error: true, ticker: sanitized, message: `데이터를 불러오지 못했어요. (${message})` },
      { status: 500 }
    )
  }
}
