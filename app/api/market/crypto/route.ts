import { NextRequest, NextResponse } from "next/server"
import { yahooFetch } from "@/lib/yahoo-finance"

// =============================================================================
// 📡 /api/market/crypto?symbols=BTC-USD,ETH-USD
//
// Yahoo Finance에서 코인 시세를 가져옵니다.
// 실패 시 Mock 데이터로 자동 폴백합니다.
//
// Yahoo Finance 코인 심볼 예시:
//   BTC-USD  — 비트코인
//   ETH-USD  — 이더리움
//   XRP-USD  — 리플
//   SOL-USD  — 솔라나
//   ADA-USD  — 에이다
//   DOGE-USD — 도지코인
// =============================================================================

const MOCK_CRYPTO: Record<string, { price: number; changeRate: number; name: string }> = {
  "BTC-USD":  { price: 96450.50, changeRate:  2.14, name: "비트코인"  },
  "ETH-USD":  { price:  2720.30, changeRate:  1.85, name: "이더리움"  },
  "XRP-USD":  { price:     2.31, changeRate:  3.42, name: "리플"      },
  "SOL-USD":  { price:   175.80, changeRate: -1.20, name: "솔라나"    },
  "ADA-USD":  { price:     0.78, changeRate:  0.55, name: "에이다"    },
  "DOGE-USD": { price:     0.23, changeRate: -0.88, name: "도지코인"  },
  "BNB-USD":  { price:   605.40, changeRate:  0.34, name: "바이낸스"  },
  "AVAX-USD": { price:    38.20, changeRate: -2.10, name: "아발란체"  },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbolsParam = searchParams.get("symbols")

  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols 파라미터가 필요합니다" }, { status: 400 })
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean)

  try {
    const raw = await yahooFetch(symbols)
    const quotes = raw.map((q: any) => {
      const rate: number = q.regularMarketChangePercent ?? 0
      return {
        symbol: q.symbol,
        name: MOCK_CRYPTO[q.symbol]?.name ?? q.shortName ?? q.symbol,
        currentPrice: q.regularMarketPrice ?? 0,
        changeRate: rate,
        changeStatus: rate > 0 ? "up" : rate < 0 ? "down" : "same",
        fetchedAt: new Date().toISOString(),
      }
    })
    return NextResponse.json({ quotes, source: "live" })
  } catch (err) {
    console.warn("[market/crypto] Yahoo Finance 실패, Mock 폴백:", err)
    const quotes = symbols.map((sym) => {
      const mock = MOCK_CRYPTO[sym] ?? { price: 0, changeRate: 0, name: sym }
      return {
        symbol: sym,
        name: mock.name,
        currentPrice: mock.price,
        changeRate: mock.changeRate,
        changeStatus: mock.changeRate > 0 ? "up" : mock.changeRate < 0 ? "down" : "same",
        fetchedAt: new Date().toISOString(),
        isMock: true,
      }
    })
    return NextResponse.json({ quotes, source: "mock" })
  }
}
