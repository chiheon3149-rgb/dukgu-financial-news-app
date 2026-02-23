"use client"

import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode
} from "react"
import type { StockHolding, TradeRecord, DividendRecord } from "@/types"

// =============================================================================
// 📈 StockPortfolioContext
//
// 주식 보유 종목 전체를 앱 전역에서 공유합니다.
// - localStorage로 임시 영속성 제공 (페이지 이동 시 데이터 유지)
// - Supabase 연결 시 이 파일의 로딩/저장 부분만 교체하면 됩니다.
// =============================================================================

const STORAGE_KEY = "dukgu:stock-holdings"

interface StockPortfolioContextValue {
  holdings: StockHolding[]
  addHolding: (holding: StockHolding) => void
  removeHolding: (ticker: string) => void
  addTrade: (ticker: string, trade: Omit<TradeRecord, "id">) => void
  removeTrade: (ticker: string, tradeId: string) => void
  addDividend: (ticker: string, dividend: Omit<DividendRecord, "id">) => void
  removeDividend: (ticker: string, dividendId: string) => void
  getHolding: (ticker: string) => StockHolding | null
}

const StockPortfolioContext = createContext<StockPortfolioContextValue | null>(null)

export function StockPortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<StockHolding[]>([])

  // localStorage에서 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setHoldings(JSON.parse(raw))
    } catch {}
  }, [])

  // 변경 시 localStorage 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
    } catch {}
  }, [holdings])

  const addHolding = useCallback((holding: StockHolding) => {
    setHoldings((prev) => {
      if (prev.some((h) => h.ticker === holding.ticker)) return prev
      return [...prev, holding]
    })
  }, [])

  const removeHolding = useCallback((ticker: string) => {
    setHoldings((prev) => prev.filter((h) => h.ticker !== ticker))
  }, [])

  const addTrade = useCallback((ticker: string, trade: Omit<TradeRecord, "id">) => {
    setHoldings((prev) =>
      prev.map((h) =>
        h.ticker === ticker
          ? { ...h, trades: [...h.trades, { ...trade, id: `t-${Date.now()}` }] }
          : h
      )
    )
  }, [])

  const removeTrade = useCallback((ticker: string, tradeId: string) => {
    setHoldings((prev) =>
      prev.map((h) =>
        h.ticker === ticker
          ? { ...h, trades: h.trades.filter((t) => t.id !== tradeId) }
          : h
      )
    )
  }, [])

  const addDividend = useCallback((ticker: string, dividend: Omit<DividendRecord, "id">) => {
    setHoldings((prev) =>
      prev.map((h) =>
        h.ticker === ticker
          ? { ...h, dividends: [...h.dividends, { ...dividend, id: `d-${Date.now()}` }] }
          : h
      )
    )
  }, [])

  const removeDividend = useCallback((ticker: string, dividendId: string) => {
    setHoldings((prev) =>
      prev.map((h) =>
        h.ticker === ticker
          ? { ...h, dividends: h.dividends.filter((d) => d.id !== dividendId) }
          : h
      )
    )
  }, [])

  const getHolding = useCallback((ticker: string): StockHolding | null => {
    return holdings.find((h) => h.ticker === ticker) ?? null
  }, [holdings])

  return (
    <StockPortfolioContext.Provider
      value={{ holdings, addHolding, removeHolding, addTrade, removeTrade, addDividend, removeDividend, getHolding }}
    >
      {children}
    </StockPortfolioContext.Provider>
  )
}

export function useStockPortfolioContext() {
  const ctx = useContext(StockPortfolioContext)
  if (!ctx) throw new Error("useStockPortfolioContext는 StockPortfolioProvider 내부에서만 사용 가능합니다.")
  return ctx
}
