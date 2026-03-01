"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useStockPortfolioContext } from "@/context/stock-portfolio-context"
import { useMarketPrice } from "./use-market-price"
import type { StockHolding, MarketQuote } from "@/types"

export interface StockRow {
  holding: StockHolding
  quote?: MarketQuote
  currentValue: number
  returnRate: number
  stats: {
    totalInvested: number
    realizedPnl: number
    avgCostPrice: number
    totalShares: number
  }
}

// 💡 포트폴리오 통계 계산기 (내부용)
export function calcPortfolioStats(holding: StockHolding) {
  let totalShares = 0
  let totalInvested = 0
  let realizedPnl = 0

  holding.trades.forEach((t) => {
    if (t.type === "buy") {
      totalInvested += t.price * t.quantity
      totalShares += t.quantity
    } else {
      const avgCost = totalShares > 0 ? totalInvested / totalShares : 0
      realizedPnl += (t.price - avgCost) * t.quantity
      totalInvested -= avgCost * t.quantity
      totalShares -= t.quantity
    }
  })

  return {
    totalShares,
    totalInvested,
    realizedPnl,
    avgCostPrice: totalShares > 0 ? totalInvested / totalShares : 0,
  }
}

export function useStockPortfolio(usdToKrw: number, accountId?: string) {
  const context = useStockPortfolioContext()
  
  // 1. 해당 계좌(혹은 전체)의 종목들만 필터링
  const accountHoldings = useMemo(() => {
    if (!accountId) return context.holdings
    return context.holdings.filter((h) => h.accountId === accountId)
  }, [context.holdings, accountId])

  const tickers = useMemo(() => accountHoldings.map((h) => h.ticker), [accountHoldings])

  // 2. 실시간 시세 가져오기 (useMarketPrice 훅 사용)
  // 💡 [수정] useMarketPrice에서 refresh 기능을 함께 받아옵니다.
  const { quotes, isLoading: isLoadingPrices, error: priceError, refresh: marketRefresh } = useMarketPrice(tickers)

  // 3. 종목별 데이터 조립
  const rows = useMemo(() => {
    return accountHoldings.map((holding) => {
      const quote = quotes[holding.ticker]
      const stats = calcPortfolioStats(holding)
      const currentPrice = quote?.currentPrice ?? 0
      const currentValue = currentPrice * stats.totalShares
      const returnRate = stats.avgCostPrice > 0 
        ? ((currentPrice - stats.avgCostPrice) / stats.avgCostPrice) * 100 
        : 0

      return { holding, quote, currentValue, returnRate, stats }
    })
  }, [accountHoldings, quotes])

  // 💡 4. [핵심 추가] 수동 새로고침 함수
  // marketRefresh가 있으면 실행하고, 없으면 그냥 넘어가도록 안전하게 짭니다.
  const refresh = useCallback(() => {
    if (marketRefresh) {
      marketRefresh()
    }
  }, [marketRefresh])

  return {
    rows,
    isLoadingPrices,
    priceError,
    refresh, // 👈 💡 이제 화면(Page)에서 이 이름을 찾아낼 수 있습니다!
    addHolding: (h: Omit<StockHolding, "accountId">) => 
      context.addHolding({ ...h, accountId: accountId || "" }),
    removeHolding: (ticker: string) => 
      context.removeHolding(accountId || "", ticker),
  }
}