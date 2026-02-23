"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import type { CryptoStats } from "@/types"
import { useCryptoPortfolioContext } from "@/context/crypto-portfolio-context"
import type { CryptoHolding, CryptoTradeRecord } from "@/types"

// =============================================================================
// 🪙 useCryptoPortfolio
//
// CryptoPortfolioContext에서 holdings를 가져와 실시간 시세와 합산합니다.
// =============================================================================

export interface CryptoQuote {
  symbol: string
  name: string
  currentPrice: number
  changeRate: number
  changeStatus: "up" | "down" | "same"
  fetchedAt: string
  isMock?: boolean
}

export interface CryptoRow {
  holding: CryptoHolding
  stats: CryptoStats
  quote: CryptoQuote | null
  currentValueUsd: number
  unrealizedPnl: number
  returnRate: number
}

export function calcCryptoStats(holding: CryptoHolding): CryptoStats {
  const sorted = [...holding.trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  let totalQty = 0
  let totalCost = 0
  let realizedPnl = 0

  for (const trade of sorted) {
    if (trade.type === "buy") {
      totalCost += trade.price * trade.quantity
      totalQty += trade.quantity
    } else {
      const avgAtSell = totalQty > 0 ? totalCost / totalQty : 0
      realizedPnl += (trade.price - avgAtSell) * trade.quantity
      totalCost -= avgAtSell * trade.quantity
      totalQty -= trade.quantity
    }
  }

  return {
    totalQuantity: Math.max(0, totalQty),
    avgCostPrice: totalQty > 0 ? totalCost / totalQty : 0,
    totalInvested: Math.max(0, totalCost),
    realizedPnl,
  }
}

const POLL_INTERVAL_MS = 30_000

export function useCryptoPortfolio() {
  const { holdings, addHolding, removeHolding, addTrade, removeTrade } = useCryptoPortfolioContext()
  const [quotes, setQuotes] = useState<Record<string, CryptoQuote>>({})
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const symbolsKey = holdings.map((h) => h.symbol).join(",")

  const fetchQuotes = useCallback(async () => {
    if (!symbolsKey) return
    try {
      const res = await fetch(`/api/market/crypto?symbols=${symbolsKey}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const map: Record<string, CryptoQuote> = {}
      for (const q of data.quotes) map[q.symbol] = q
      setQuotes(map)
      setPriceError(null)
    } catch {
      setPriceError("코인 시세를 불러오지 못했습니다")
    } finally {
      setIsLoadingPrices(false)
    }
  }, [symbolsKey])

  useEffect(() => {
    if (!symbolsKey) return
    setIsLoadingPrices(true)
    fetchQuotes()
    intervalRef.current = setInterval(fetchQuotes, POLL_INTERVAL_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchQuotes, symbolsKey])

  const rows = useMemo<CryptoRow[]>(() => {
    return holdings.map((holding) => {
      const stats = calcCryptoStats(holding)
      const quote = quotes[holding.symbol] ?? null
      const currentPrice = quote?.currentPrice ?? 0
      const currentValueUsd = currentPrice * stats.totalQuantity
      const unrealizedPnl = (currentPrice - stats.avgCostPrice) * stats.totalQuantity
      const returnRate = stats.totalInvested > 0 ? (unrealizedPnl / stats.totalInvested) * 100 : 0
      return { holding, stats, quote, currentValueUsd, unrealizedPnl, returnRate }
    })
  }, [holdings, quotes])

  const totalValueUsd = useMemo(
    () => rows.reduce((acc, r) => acc + r.currentValueUsd, 0),
    [rows]
  )

  return { rows, totalValueUsd, isLoadingPrices, priceError, addHolding, removeHolding, addTrade, removeTrade }
}
