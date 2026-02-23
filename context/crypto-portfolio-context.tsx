"use client"

import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode
} from "react"
import type { CryptoHolding, CryptoTradeRecord } from "@/types"

// =============================================================================
// 🪙 CryptoPortfolioContext
//
// 코인 보유 목록 전체를 앱 전역에서 공유합니다.
// localStorage 기반 임시 영속성 제공.
// =============================================================================

const STORAGE_KEY = "dukgu:crypto-holdings"

interface CryptoPortfolioContextValue {
  holdings: CryptoHolding[]
  addHolding: (holding: CryptoHolding) => void
  removeHolding: (symbol: string) => void
  addTrade: (symbol: string, trade: Omit<CryptoTradeRecord, "id">) => void
  removeTrade: (symbol: string, tradeId: string) => void
  getHolding: (symbol: string) => CryptoHolding | null
}

const CryptoPortfolioContext = createContext<CryptoPortfolioContextValue | null>(null)

export function CryptoPortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<CryptoHolding[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setHoldings(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
    } catch {}
  }, [holdings])

  const addHolding = useCallback((holding: CryptoHolding) => {
    setHoldings((prev) => {
      if (prev.some((h) => h.symbol === holding.symbol)) return prev
      return [...prev, holding]
    })
  }, [])

  const removeHolding = useCallback((symbol: string) => {
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol))
  }, [])

  const addTrade = useCallback((symbol: string, trade: Omit<CryptoTradeRecord, "id">) => {
    setHoldings((prev) =>
      prev.map((h) =>
        h.symbol === symbol
          ? { ...h, trades: [...h.trades, { ...trade, id: `ct-${Date.now()}` }] }
          : h
      )
    )
  }, [])

  const removeTrade = useCallback((symbol: string, tradeId: string) => {
    setHoldings((prev) =>
      prev.map((h) =>
        h.symbol === symbol
          ? { ...h, trades: h.trades.filter((t) => t.id !== tradeId) }
          : h
      )
    )
  }, [])

  const getHolding = useCallback((symbol: string): CryptoHolding | null => {
    return holdings.find((h) => h.symbol === symbol) ?? null
  }, [holdings])

  return (
    <CryptoPortfolioContext.Provider
      value={{ holdings, addHolding, removeHolding, addTrade, removeTrade, getHolding }}
    >
      {children}
    </CryptoPortfolioContext.Provider>
  )
}

export function useCryptoPortfolioContext() {
  const ctx = useContext(CryptoPortfolioContext)
  if (!ctx) throw new Error("useCryptoPortfolioContext는 CryptoPortfolioProvider 내부에서만 사용 가능합니다.")
  return ctx
}
