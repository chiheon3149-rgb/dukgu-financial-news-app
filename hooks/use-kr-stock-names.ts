"use client"

import { useState, useEffect } from "react"

/**
 * 한국 티커 목록을 받아 /api/stock/kr-names 경유로 한국어 이름을 일괄 조회합니다.
 * (서버 사이드 Supabase 사용 → RLS 무관하게 동작)
 */
export function useKrStockNames(tickers: string[]): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({})

  const krTickers = tickers.filter((t) => t.endsWith(".KS") || t.endsWith(".KQ"))
  const key = [...krTickers].sort().join(",")

  useEffect(() => {
    if (!key) return
    fetch(`/api/stock/kr-names?tickers=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((data: Record<string, string>) => setNames(data))
      .catch(() => {/* 조용히 실패 */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return names
}

/**
 * holding.name이 티커 코드처럼 보이면 true (예: "498400.KS", "498400", "A")
 * DB에서 가져온 이름(krNames)이 있으면 항상 그걸 우선 사용하는 게 더 안전하므로,
 * kr_stocks에 이름이 있으면 무조건 교체합니다.
 */
export function isTickerAsName(name: string, ticker: string): boolean {
  // kr 티커면 항상 DB 이름 시도 (DB에 없으면 원본 유지)
  if (ticker.endsWith(".KS") || ticker.endsWith(".KQ")) return true
  return name === ticker || /^\d{5,6}(\.[KQ][SQ])?$/i.test(name)
}
