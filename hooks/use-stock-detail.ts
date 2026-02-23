"use client"

import { useMemo } from "react"
import type { AvgCostDataPoint } from "@/types"
import { useStockPortfolioContext } from "@/context/stock-portfolio-context"
import { calcPortfolioStats } from "./use-stock-portfolio"
import { useMarketPrice } from "./use-market-price"

// =============================================================================
// 🔍 useStockDetail
//
// 단일 종목 상세 페이지에 필요한 데이터를 제공합니다.
// StockPortfolioContext에서 holding을 읽어 Context의 add/remove 함수도 노출합니다.
// =============================================================================

export function useStockDetail(ticker: string) {
  const { getHolding, addTrade, removeTrade, addDividend, removeDividend } = useStockPortfolioContext()

  const holding = getHolding(ticker)

  const { quotes, isLoading: isLoadingPrice } = useMarketPrice(holding ? [ticker] : [])
  const rawQuote = quotes[ticker] ?? null

  const stats = useMemo(
    () => (holding ? calcPortfolioStats(holding) : null),
    [holding]
  )

  /** 평단가 추이 차트 데이터 — 매매 시점별 누적 평단가 계산 */
  const chartData = useMemo<AvgCostDataPoint[]>(() => {
    if (!holding) return []

    const sorted = [...holding.trades].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let totalShares = 0
    let totalCost = 0

    return sorted.map((trade) => {
      if (trade.type === "buy") {
        totalCost += trade.price * trade.quantity
        totalShares += trade.quantity
      } else {
        const avg = totalShares > 0 ? totalCost / totalShares : 0
        totalCost -= avg * trade.quantity
        totalShares -= trade.quantity
      }

      return {
        date: trade.date,
        avgCost: totalShares > 0 ? Math.round(totalCost / totalShares) : 0,
        tradePrice: trade.price,
        tradeType: trade.type,
        shares: trade.quantity,
      }
    })
  }, [holding])

  return {
    holding,
    stats,
    quote: rawQuote,
    chartData,
    isLoadingPrice,
    // Context에서 ticker를 바인딩해 expose
    addTrade: (trade: Parameters<typeof addTrade>[1]) => addTrade(ticker, trade),
    removeTrade: (id: string) => removeTrade(ticker, id),
    addDividend: (div: Parameters<typeof addDividend>[1]) => addDividend(ticker, div),
    removeDividend: (id: string) => removeDividend(ticker, id),
  }
}
