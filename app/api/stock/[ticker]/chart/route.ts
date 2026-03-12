/**
 * app/api/stock/[ticker]/chart/route.ts
 * =======================================
 * 💡 이 API는 차트 데이터만 빠르게 가져오는 전용 엔드포인트예요.
 *    인트라데이(분봉/시봉) 조회 시 호출돼요.
 *
 *    GET /api/stock/AAPL/chart?interval=5m
 *    GET /api/stock/005930.KS/chart?interval=1h
 *
 * 📌 시간 표시 기준: 모든 시간은 한국 표준시(KST = UTC+9) 기준으로 변환해요.
 *    예) UTC 00:30 → KST 09:30 → 화면에 "09:30" 표시
 */

import { NextRequest, NextResponse } from "next/server"
import YahooFinanceClass from "yahoo-finance2"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinanceClass as any)()

// interval → 조회할 과거 일수 매핑
// 💡 5분봉은 야후가 최대 7일치만 줘요. 1시간봉은 최대 730일치.
const INTERVAL_DAYS: Record<string, number> = {
  "5m":  1,    // 1일치 5분봉
  "15m": 3,    // 3일치 15분봉
  "1h":  7,    // 7일치 1시간봉
  "1d":  365,  // 1년치 일봉 (기존과 동일)
}

/**
 * UTC Date → KST 표시 문자열 변환
 * 💡 야후 파이낸스는 UTC로 시간을 줘요.
 *    한국 주식 투자자에게 맞게 KST(+9시간)로 바꿔서 보여줘요.
 *    마치 '세계 시간표를 한국 시간표로 번역'하는 것과 같아요!
 *
 * - 인트라데이:  "09:30", "14:25" 형식
 * - 일봉:        "3/12", "12/31" 형식
 */
function toKSTLabel(date: Date, isIntraday: boolean): string {
  // UTC 타임스탬프에 9시간(= 9 * 60 * 60 * 1000 ms)을 더해 KST로 변환
  const kstMs  = date.getTime() + 9 * 60 * 60 * 1000
  const kst    = new Date(kstMs)

  if (isIntraday) {
    // 시:분 형식 ("09:05", "14:30")
    const h = String(kst.getUTCHours()).padStart(2, "0")
    const m = String(kst.getUTCMinutes()).padStart(2, "0")
    return `${h}:${m}`
  } else {
    // 월/일 형식 ("3/12")
    return `${kst.getUTCMonth() + 1}/${kst.getUTCDate()}`
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params

  const sanitized = ticker.replace(/[^a-zA-Z0-9.\-]/g, "").toUpperCase()
  if (!sanitized) {
    return NextResponse.json({ error: true, message: "유효하지 않은 티커 코드예요." }, { status: 400 })
  }

  // interval 파라미터 검증
  const intervalParam = req.nextUrl.searchParams.get("interval") ?? "1d"
  const validIntervals = ["5m", "15m", "1h", "1d"]
  const interval = validIntervals.includes(intervalParam) ? intervalParam : "1d"

  const isIntraday = ["5m", "15m", "1h"].includes(interval)
  const daysBack   = INTERVAL_DAYS[interval] ?? 365
  const period1    = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

  try {
    // 💡 야후 파이낸스의 '주가 일기장'을 해당 기간·단위로 꺼내요
    const hist = await yahooFinance.chart(sanitized, {
      period1,
      period2:  new Date(),
      interval,
    })

    // 💡 날것(UTC)의 데이터를 KST 레이블 + 종가로 가공해요
    const chart_data = (hist.quotes ?? [])
      .filter((q: any) => q.close != null)
      .map((q: any) => ({
        date:  toKSTLabel(q.date as Date, isIntraday),
        close: parseFloat((q.close as number).toFixed(4)),
      }))

    return NextResponse.json({ error: false, interval, chart_data })

  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류"
    console.error(`[API /stock/${sanitized}/chart]`, message)
    return NextResponse.json(
      { error: true, message: `차트 데이터를 불러오지 못했어요. (${message})` },
      { status: 500 }
    )
  }
}
