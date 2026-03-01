"use client"

import { useState, useEffect, useMemo } from "react"
import { useStockPortfolioContext } from "@/context/stock-portfolio-context"
import type { MarketQuote, TradeRecord, DividendRecord, AvgCostDataPoint } from "@/types"
import { calcPortfolioStats } from "./use-stock-portfolio"

// =============================================================================
// 📈 useStockDetail
//
// 특정 계좌의 특정 종목에 대한 상세 데이터를 관리하는 훅입니다.
// 💡 이제 매매 내역의 메모를 수정하는 'updateTrade'가 추가되었습니다!
// =============================================================================

export function useStockDetail(accountId: string, ticker: string) {
  const context = useStockPortfolioContext()
  
  // 💡 중앙 창고에서 '특정 계좌'의 '특정 티커'를 정확히 꺼내옵니다.
  const holding = context.getHolding(accountId, ticker)

  const [quote, setQuote] = useState<MarketQuote | null>(null)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)

  // 실시간 시세 불러오기
  useEffect(() => {
    if (!ticker) return
    let isMounted = true
    setIsLoadingPrice(true)
    fetch(`/api/market/quotes?tickers=${ticker}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.length > 0) setQuote(data[0])
      })
      .catch(() => {})
      .finally(() => { if (isMounted) setIsLoadingPrice(false) })
    return () => { isMounted = false }
  }, [ticker])

  const stats = useMemo(() => (holding ? calcPortfolioStats(holding) : null), [holding])

  // 차트 데이터 생성 로직
  const chartData = useMemo(() => {
    if (!holding) return []
    const sortedTrades = [...holding.trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let totalShares = 0
    let totalCost = 0
    const data: AvgCostDataPoint[] = []

    sortedTrades.forEach(t => {
      if (t.type === 'buy') {
        totalCost += t.price * t.quantity
        totalShares += t.quantity
      } else {
        const avg = totalShares > 0 ? totalCost / totalShares : 0
        totalCost -= avg * t.quantity
        totalShares -= t.quantity
      }
      data.push({
        date: t.date,
        avgCost: totalShares > 0 ? totalCost / totalShares : 0,
        tradePrice: t.price,
        tradeType: t.type,
        shares: totalShares
      })
    })
    return data
  }, [holding])

  // 💡 [핵심] 화면 단에서 편하게 쓰도록 accountId와 ticker를 미리 묶어서 함수를 줍니다!
  const addTrade = (trade: Omit<TradeRecord, "id">) => context.addTrade(accountId, ticker, trade)
  const removeTrade = (tradeId: string) => context.removeTrade(accountId, ticker, tradeId)
  
  // 💡 [신규 추가] 메모 수정을 위한 중간 다리 함수
  const updateTrade = (tradeId: string, memo: string) => context.updateTrade(accountId, ticker, tradeId, memo)

  const addDividend = (dividend: Omit<DividendRecord, "id">) => context.addDividend(accountId, ticker, dividend)
  const removeDividend = (dividendId: string) => context.removeDividend(accountId, ticker, dividendId)

  return {
    holding,
    stats,
    quote,
    chartData,
    isLoadingPrice,
    addTrade,
    removeTrade,
    updateTrade, // 👈 💡 이제 화면(Page)에서 이 기능을 갖다 쓸 수 있습니다!
    addDividend,
    removeDividend
  }
}