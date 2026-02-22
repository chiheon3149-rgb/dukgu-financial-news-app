"use client"

import { useState, useMemo } from "react"
import type { StockHolding, TradeRecord, DividendRecord, AvgCostDataPoint } from "@/types"
import { MOCK_STOCK_HOLDINGS } from "@/lib/mock/stocks"
import { calcPortfolioStats } from "./use-stock-portfolio"
import { useMarketPrice } from "./use-market-price"

// =============================================================================
// 🔍 useStockDetail
//
// 역할: 단일 종목 상세 페이지에 필요한 모든 데이터를 제공합니다.
// - 기본 정보 + 실시간 시세
// - 평단가 통계 (calcPortfolioStats 재사용)
// - 차트 데이터: 매매 시점별 누적 평단가 추이
// - 매매 내역 리스트
// - 배당 내역 리스트
//
// 🔄 Supabase 전환 시: 초기 holding 데이터 로딩 부분만 교체하면 됩니다.
// =============================================================================

interface UseStockDetailReturn {
  holding: StockHolding | null
  stats: ReturnType<typeof calcPortfolioStats> | null
  quote: { currentPrice: number; changeRate: number; changeStatus: string } | null
  chartData: AvgCostDataPoint[]
  isLoadingPrice: boolean
  addTrade: (trade: Omit<TradeRecord, "id">) => void
  removeTrade: (id: string) => void
  addDividend: (dividend: Omit<DividendRecord, "id">) => void
}

export function useStockDetail(ticker: string): UseStockDetailReturn {
  // 초기 데이터: Mock → 나중에 Supabase로 교체
  const [holding, setHolding] = useState<StockHolding | null>(
    () => MOCK_STOCK_HOLDINGS.find((h) => h.ticker === ticker) ?? null
  )

  const { quotes, isLoading: isLoadingPrice } = useMarketPrice(holding ? [ticker] : [])
  const rawQuote = quotes[ticker] ?? null

  const stats = useMemo(
    () => (holding ? calcPortfolioStats(holding) : null),
    [holding]
  )

  /**
   * 차트 데이터 계산
   *
   * 매매 내역을 날짜 순으로 읽으면서 누적 평단가를 계산합니다.
   * 마치 통장 잔액 변화를 그래프로 그리는 것처럼,
   * 매수할 때마다 평단가가 움직이고 매도하면 수량만 줄어드는 과정을 시각화합니다.
   */
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

  // 매매 추가: 임시 UUID 생성 후 상태 업데이트
  const addTrade = (trade: Omit<TradeRecord, "id">) => {
    if (!holding) return
    const newTrade: TradeRecord = {
      ...trade,
      id: `t-${Date.now()}`,
    }
    setHolding((prev) =>
      prev ? { ...prev, trades: [...prev.trades, newTrade] } : prev
    )
  }

  const removeTrade = (id: string) => {
    setHolding((prev) =>
      prev ? { ...prev, trades: prev.trades.filter((t) => t.id !== id) } : prev
    )
  }

  const addDividend = (dividend: Omit<DividendRecord, "id">) => {
    if (!holding) return
    const newDiv: DividendRecord = { ...dividend, id: `d-${Date.now()}` }
    setHolding((prev) =>
      prev ? { ...prev, dividends: [...prev.dividends, newDiv] } : prev
    )
  }

  return {
    holding,
    stats,
    quote: rawQuote,
    chartData,
    isLoadingPrice,
    addTrade,
    removeTrade,
    addDividend,
  }
}
