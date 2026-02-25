"use client"

import { useState, useMemo, useCallback } from "react"
import type { AssetHistoryItem, ChangeStatus } from "@/types"
import { MOCK_ASSET_HISTORY } from "@/lib/mock/assets"

// =============================================================================
// 📅 useAssetHistory 훅
//
// 역할: 일별 자산 기록 데이터 + 기간별 요약 통계를 함께 제공합니다.
// HistoryList, HistorySummary 두 컴포넌트가 이 훅 하나를 공유합니다.
//
// 🔄 Supabase 전환 시: fetchHistory 내부를
//    supabase.from('asset_history').select('*').gte('date', start).lte('date', end) 로 교체.
// =============================================================================

export type HistoryViewMode = "yesterday" | "7days" | "month"

interface DateRange {
  start: string
  end: string
}

/** 기간 요약 통계 */
interface PeriodSummary {
  label: string
  diffKrw: number
  changeStatus: ChangeStatus
}

interface UseAssetHistoryReturn {
  history: AssetHistoryItem[]
  summary: PeriodSummary
  viewMode: HistoryViewMode
  dateRange: DateRange
  isLoading: boolean
  setViewMode: (mode: HistoryViewMode) => void
  setDateRange: (range: DateRange) => void
}

const VIEW_MODE_LABELS: Record<HistoryViewMode, string> = {
  yesterday: "어제 대비",
  "7days": "7일 대비",
  month: "한 달 대비",
}

export function useAssetHistory(): UseAssetHistoryReturn {
  const [viewMode, setViewMode] = useState<HistoryViewMode>("yesterday")
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" })
  const [isLoading] = useState(false)

  /** 선택된 뷰 모드 또는 커스텀 날짜 범위에 따라 필터링 */
  const history = useMemo<AssetHistoryItem[]>(() => {
    if (dateRange.start || dateRange.end) {
      return MOCK_ASSET_HISTORY.filter((item) => {
        const afterStart = !dateRange.start || item.date >= dateRange.start
        const beforeEnd = !dateRange.end || item.date <= dateRange.end
        return afterStart && beforeEnd
      })
    }

    const today = new Date()
    let cutoffDate: Date

    if (viewMode === "yesterday") {
      cutoffDate = new Date(today)
      cutoffDate.setDate(today.getDate() - 1)
    } else if (viewMode === "7days") {
      cutoffDate = new Date(today)
      cutoffDate.setDate(today.getDate() - 7)
    } else {
      cutoffDate = new Date(today)
      cutoffDate.setMonth(today.getMonth() - 1)
    }

    const cutoff = cutoffDate.toISOString().split("T")[0]
    return MOCK_ASSET_HISTORY.filter((item) => item.date >= cutoff)
  }, [viewMode, dateRange])

  /** 필터된 데이터 기반으로 기간 요약 계산 */
  const summary = useMemo<PeriodSummary>(() => {
    const totalDiff = history.reduce((acc, item) => acc + item.changeKrw, 0)
    return {
      label: dateRange.start
        ? `${dateRange.start} ~ ${dateRange.end || "현재"}`
        : VIEW_MODE_LABELS[viewMode],
      diffKrw: totalDiff,
      changeStatus: totalDiff > 0 ? "up" : totalDiff < 0 ? "down" : "same",
    }
  }, [history, viewMode, dateRange])

  const handleSetViewMode = useCallback((mode: HistoryViewMode) => {
    setViewMode(mode)
    // 뷰 모드를 선택하면 커스텀 날짜 범위를 초기화합니다
    setDateRange({ start: "", end: "" })
  }, [])

  return {
    history,
    summary,
    viewMode,
    dateRange,
    isLoading,
    setViewMode: handleSetViewMode,
    setDateRange,
  }
}
