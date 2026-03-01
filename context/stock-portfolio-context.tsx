"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { toast } from "sonner"
import type { StockHolding, TradeRecord, DividendRecord } from "@/types"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

// =============================================================================
// 📈 StockPortfolioContext (Supabase DB 연동 & 메모 수정 지원)
// =============================================================================

interface StockPortfolioContextValue {
  holdings: StockHolding[]
  addHolding: (holding: StockHolding) => void
  removeHolding: (accountId: string, ticker: string) => void
  addTrade: (accountId: string, ticker: string, trade: Omit<TradeRecord, "id">) => void
  removeTrade: (accountId: string, ticker: string, tradeId: string) => void
  // 💡 [수정] 메모 수정을 위한 인터페이스를 설계도에 명시적으로 추가했습니다.
  updateTrade: (accountId: string, ticker: string, tradeId: string, memo: string) => Promise<void>
  addDividend: (accountId: string, ticker: string, dividend: Omit<DividendRecord, "id">) => void
  removeDividend: (accountId: string, ticker: string, dividendId: string) => void
  getHolding: (accountId: string, ticker: string) => StockHolding | null
}

const StockPortfolioContext = createContext<StockPortfolioContextValue | null>(null)

export function StockPortfolioProvider({ children }: { children: ReactNode }) {
  const { profile } = useUser()
  const [holdings, setHoldings] = useState<StockHolding[]>([])

  // 1️⃣ [READ] 모든 데이터 초기 로드
  useEffect(() => {
    if (!profile?.id) return

    const fetchPortfolio = async () => {
      try {
        const [hRes, tRes, dRes] = await Promise.all([
          supabase.from("asset_stock_holdings").select("*").eq("user_id", profile.id),
          supabase.from("asset_stock_trades").select("*").eq("user_id", profile.id),
          supabase.from("asset_stock_dividends").select("*").eq("user_id", profile.id),
        ])

        if (hRes.error) throw hRes.error

        const tradesData = tRes.data || []
        const dividendsData = dRes.data || []

        const formattedHoldings: StockHolding[] = (hRes.data || []).map((h) => ({
          id: h.id,
          accountId: h.account_id,
          ticker: h.ticker,
          name: h.name,
          currency: h.currency as "KRW" | "USD",
          trades: tradesData
            .filter((t) => t.holding_id === h.id)
            .map((t) => ({
              id: t.id,
              date: t.trade_date,
              type: t.trade_type as "buy" | "sell",
              price: Number(t.price),
              quantity: Number(t.quantity),
              memo: t.memo || undefined,
            })),
          dividends: dividendsData
            .filter((d) => d.holding_id === h.id)
            .map((d) => ({
              id: d.id,
              date: d.dividend_date,
              amountPerShare: Number(d.amount_per_share),
              sharesHeld: Number(d.shares_held),
              currency: d.currency as "KRW" | "USD",
            })),
        }))

        setHoldings(formattedHoldings)
      } catch (error) {
        console.error("데이터 로드 실패:", error)
      }
    }
    fetchPortfolio()
  }, [profile?.id])

  // 2️⃣ [CREATE] 종목 추가
  const addHolding = useCallback(async (holding: StockHolding) => {
    if (!profile?.id || !holding.accountId) return
    try {
      const { data, error } = await supabase
        .from("asset_stock_holdings")
        .insert({ user_id: profile.id, account_id: holding.accountId, ticker: holding.ticker, name: holding.name, currency: holding.currency })
        .select().single()

      if (error) throw error
      setHoldings((prev) => [...prev, { ...holding, id: data.id, trades: [], dividends: [] }])
    } catch (error) { toast.error("종목 추가 중 오류가 발생했습니다.") }
  }, [profile?.id])

  // 3️⃣ [DELETE] 종목 삭제
  const removeHolding = useCallback(async (accountId: string, ticker: string) => {
    const target = holdings.find((h) => h.accountId === accountId && h.ticker === ticker)
    if (!target?.id) return
    try {
      await supabase.from("asset_stock_holdings").delete().eq("id", target.id)
      setHoldings((prev) => prev.filter((h) => h.id !== target.id))
    } catch (error) { toast.error("종목 삭제 실패") }
  }, [holdings])

  // 4️⃣ [CREATE] 매매 내역 추가
  const addTrade = useCallback(async (accountId: string, ticker: string, trade: Omit<TradeRecord, "id">) => {
    if (!profile?.id) return
    const target = holdings.find((h) => h.accountId === accountId && h.ticker === ticker)
    if (!target?.id) return

    try {
      const { data, error } = await supabase
        .from("asset_stock_trades")
        .insert({ user_id: profile.id, holding_id: target.id, trade_date: trade.date, trade_type: trade.type, price: trade.price, quantity: trade.quantity, memo: trade.memo })
        .select().single()

      if (error) throw error
      setHoldings((prev) => prev.map((h) => h.id === target.id ? { ...h, trades: [...h.trades, { ...trade, id: data.id }] } : h))
      toast.success("기록되었습니다.")
    } catch (error) { toast.error("저장 실패") }
  }, [holdings, profile?.id])

  // 💡 5️⃣ [UPDATE] 매매 내역 (메모) 수정 기능 구현
  const updateTrade = useCallback(async (accountId: string, ticker: string, tradeId: string, memo: string) => {
    try {
      const { error } = await supabase
        .from("asset_stock_trades")
        .update({ memo }) // 💡 DB 원장 수정
        .eq("id", tradeId)

      if (error) throw error

      // 💡 로컬 상태 업데이트 (화면 즉시 반영)
      setHoldings((prev) =>
        prev.map((h) =>
          h.accountId === accountId && h.ticker === ticker
            ? { ...h, trades: h.trades.map((t) => (t.id === tradeId ? { ...t, memo } : t)) }
            : h
        )
      )
      toast.success("메모가 수정되었습니다.")
    } catch (error) {
      toast.error("메모 수정 중 오류가 발생했습니다.")
    }
  }, [])

  // 6️⃣ [DELETE] 매매 내역 삭제
  const removeTrade = useCallback(async (accountId: string, ticker: string, tradeId: string) => {
    try {
      await supabase.from("asset_stock_trades").delete().eq("id", tradeId)
      setHoldings((prev) => prev.map((h) => h.accountId === accountId && h.ticker === ticker ? { ...h, trades: h.trades.filter((t) => t.id !== tradeId) } : h))
    } catch (error) { toast.error("삭제 실패") }
  }, [])

  // 7️⃣ [CREATE] 배당 내역 추가
  const addDividend = useCallback(async (accountId: string, ticker: string, dividend: Omit<DividendRecord, "id">) => {
    if (!profile?.id) return
    const target = holdings.find((h) => h.accountId === accountId && h.ticker === ticker)
    if (!target?.id) return

    try {
      const { data, error } = await supabase
        .from("asset_stock_dividends")
        .insert({ user_id: profile.id, holding_id: target.id, dividend_date: dividend.date, amount_per_share: dividend.amountPerShare, shares_held: dividend.sharesHeld, currency: dividend.currency })
        .select().single()

      if (error) throw error
      setHoldings((prev) => prev.map((h) => h.id === target.id ? { ...h, dividends: [...h.dividends, { ...dividend, id: data.id }] } : h))
      toast.success("배당 기록 완료 💰")
    } catch (error) { toast.error("저장 실패") }
  }, [holdings, profile?.id])

  // 8️⃣ [DELETE] 배당 내역 삭제
  const removeDividend = useCallback(async (accountId: string, ticker: string, dividendId: string) => {
    try {
      await supabase.from("asset_stock_dividends").delete().eq("id", dividendId)
      setHoldings((prev) => prev.map((h) => h.accountId === accountId && h.ticker === ticker ? { ...h, dividends: h.dividends.filter((d) => d.id !== dividendId) } : h))
    } catch (error) { toast.error("삭제 실패") }
  }, [])

  const getHolding = useCallback((accountId: string, ticker: string): StockHolding | null => {
    return holdings.find((h) => h.ticker === ticker && h.accountId === accountId) ?? null
  }, [holdings])

  return (
    <StockPortfolioContext.Provider
      value={{ holdings, addHolding, removeHolding, addTrade, removeTrade, updateTrade, addDividend, removeDividend, getHolding }}
    >
      {children}
    </StockPortfolioContext.Provider>
  )
}

export function useStockPortfolioContext() {
  const ctx = useContext(StockPortfolioContext)
  if (!ctx) throw new Error("StockPortfolioProvider 내부에서 사용하세요.")
  return ctx
}