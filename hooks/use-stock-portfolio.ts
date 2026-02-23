"use client"

import { useMemo } from "react"
import type { StockHolding, PortfolioStats, MarketQuote } from "@/types"
import { useStockPortfolioContext } from "@/context/stock-portfolio-context"
import { useMarketPrice } from "./use-market-price"

// =============================================================================
// 📈 useStockPortfolio
//
// StockPortfolioContext에서 holdings를 가져와 실시간 시세와 합산합니다.
// 주식 목록 페이지(/assets/stocks)에서 사용합니다.
// =============================================================================

export function calcPortfolioStats(holding: StockHolding): PortfolioStats {
  const sorted = [...holding.trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  let totalShares = 0
  let totalCost = 0
  let realizedPnl = 0

  for (const trade of sorted) {
    if (trade.type === "buy") {
      totalCost += trade.price * trade.quantity
      totalShares += trade.quantity
    } else {
      const avgAtSell = totalShares > 0 ? totalCost / totalShares : 0
      realizedPnl += (trade.price - avgAtSell) * trade.quantity
      totalCost -= avgAtSell * trade.quantity
      totalShares -= trade.quantity
    }
  }

  return {
    totalShares: Math.max(0, totalShares),
    avgCostPrice: totalShares > 0 ? totalCost / totalShares : 0,
    totalInvested: Math.max(0, totalCost),
    realizedPnl,
  }
}

export interface StockRow {
  holding: StockHolding
  stats: PortfolioStats
  quote: MarketQuote | null
  currentValue: number
  unrealizedPnl: number
  returnRate: number
}

export function useStockPortfolio(usdToKrwRate = 1432) {
  const { holdings, addHolding, removeHolding } = useStockPortfolioContext()

  const tickers = holdings.map((h) => h.ticker)
  const { quotes, isLoading: isLoadingPrices, error: priceError } = useMarketPrice(tickers)

  const rows = useMemo<StockRow[]>(() => {
    return holdings.map((holding) => {
      const stats = calcPortfolioStats(holding)
      const quote = quotes[holding.ticker] ?? null
      const currentPrice = quote?.currentPrice ?? 0
      const currentValue = currentPrice * stats.totalShares
      const unrealizedPnl = (currentPrice - stats.avgCostPrice) * stats.totalShares
      const returnRate =
        stats.totalInvested > 0 ? (unrealizedPnl / stats.totalInvested) * 100 : 0
      return { holding, stats, quote, currentValue, unrealizedPnl, returnRate }
    })
  }, [holdings, quotes])

  const totalValueUsd = useMemo(() => {
    return rows.reduce((acc, row) => {
      const valueInUsd =
        row.holding.currency === "KRW"
          ? row.currentValue / usdToKrwRate
          : row.currentValue
      return acc + valueInUsd
    }, 0)
  }, [rows, usdToKrwRate])

  return { rows, totalValueUsd, isLoadingPrices, priceError, addHolding, removeHolding }
}
