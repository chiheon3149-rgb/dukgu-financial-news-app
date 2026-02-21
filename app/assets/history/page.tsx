"use client"

import React, { useState, useMemo } from "react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { HistorySummary } from "@/components/dukgu/history-summary"
import { DateRangePicker } from "@/components/dukgu/date-range-picker"
import { HistoryList } from "@/components/dukgu/history-list"

export default function AssetHistoryPage() {
  const [viewMode, setViewMode] = useState<"yesterday" | "7days" | "month" | "custom">("yesterday")
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [dateRange, setDateRange] = useState({ start: "2026-02-15", end: "2026-02-22" })

  const historyData = [
    { date: "2026-02-22", total: 850500000, change: 500000, status: "up" },
    { date: "2026-02-21", total: 850000000, change: -1200000, status: "down" },
    { date: "2026-02-20", total: 851200000, change: 3000000, status: "up" },
    { date: "2026-02-19", total: 848200000, change: 0, status: "same" },
    { date: "2026-02-18", total: 848200000, change: 150000, status: "up" },
    { date: "2026-02-15", total: 847300000, change: 200000, status: "up" },
    { date: "2026-01-31", total: 851700000, change: -500000, status: "down" },
  ]

  const filteredList = useMemo(() => {
    if (viewMode === "yesterday") return historyData.filter(item => item.date >= "2026-02-21")
    if (viewMode === "7days") return historyData.filter(item => item.date >= "2026-02-15")
    if (viewMode === "month") return historyData.filter(item => item.date >= "2026-02-01")
    if (viewMode === "custom") {
      return historyData.filter(item => item.date >= dateRange.start && item.date <= dateRange.end)
    }
    return historyData
  }, [viewMode, dateRange])

  const summary = useMemo(() => {
    if (filteredList.length === 0) return { diff: 0, label: "데이터 없음", isPlus: true }
    const latest = filteredList[0].total
    const oldest = filteredList[filteredList.length - 1].total
    const diff = latest - oldest
    let label = viewMode === "yesterday" ? "어제 대비" : viewMode === "7days" ? "최근 7일간" : viewMode === "month" ? "이번 달 누적" : `${dateRange.start.replace(/-/g, ".")} ~ ${dateRange.end.replace(/-/g, ".")}`
    return { diff, label, isPlus: diff >= 0 }
  }, [filteredList, viewMode, dateRange])

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DetailHeader title="자산 증감 기록" />
      {isPickerOpen && <div className="fixed inset-0 z-40 bg-black/[0.02]" onClick={() => setIsPickerOpen(false)} />}
      <main className="max-w-md mx-auto px-5 py-6 space-y-6">
        <div className="relative">
          <HistorySummary 
            {...summary} 
            isOpen={isPickerOpen}
            viewMode={viewMode}
            onModeChange={setViewMode}
            onPickerOpen={() => setIsPickerOpen(true)}
          />
          {isPickerOpen && (
            <DateRangePicker 
              range={dateRange} 
              onApply={(range) => { setDateRange(range); setViewMode("custom"); setIsPickerOpen(false); }} 
            />
          )}
        </div>
        <HistoryList data={filteredList} />
      </main>
    </div>
  )
}