"use client"

import { useState, useEffect, useMemo } from "react"
import type { DailyBriefingLog, IndexSummary } from "@/types"
import { supabase } from "@/lib/supabase"

// =============================================================================
// ⚡ useBriefingLogs 훅
//
// 역할: 브리핑 로그 목록 + 검색/날짜 필터링 로직을 담당합니다.
// Supabase briefings 테이블에서 데이터를 로드하고
// 날짜별로 morning/afternoon을 묶어 DailyBriefingLog 형태로 반환합니다.
// =============================================================================

interface BriefingRow {
  id: string
  date: string         // YYYY-MM-DD (DB date 타입)
  type: string         // "morning" | "afternoon"
  time: string
  headline: string
  indices: IndexSummary[] | null
  is_ready: boolean | null
}

interface DateRange {
  start: string
  end: string
}

interface UseBriefingLogsReturn {
  logs: DailyBriefingLog[]
  isLoading: boolean
  searchQuery: string
  dateRange: DateRange
  setSearchQuery: (q: string) => void
  setDateRange: (range: DateRange) => void
}

/** YYYY-MM-DD → "2026년 2월 21일(토요일)" */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${days[date.getDay()]})`
}

/** DB rows → DailyBriefingLog[] (날짜 기준 그룹핑) */
function groupByDate(rows: BriefingRow[]): DailyBriefingLog[] {
  const map = new Map<string, { morning?: BriefingRow; afternoon?: BriefingRow }>()

  for (const row of rows) {
    if (!map.has(row.date)) map.set(row.date, {})
    const entry = map.get(row.date)!
    if (row.type === "morning") entry.morning = row
    else entry.afternoon = row
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // 최신 날짜 우선
    .map(([date, s]) => ({
      id: date,
      date: formatDateLabel(date),
      morning: s.morning
        ? {
            type: "morning" as const,
            time: s.morning.time,
            headline: s.morning.headline,
            indices: s.morning.indices ?? [],
            isReady: s.morning.is_ready ?? false,
          }
        : { type: "morning" as const, time: "", headline: "준비 중", indices: [], isReady: false },
      afternoon: s.afternoon
        ? {
            type: "afternoon" as const,
            time: s.afternoon.time,
            headline: s.afternoon.headline,
            indices: s.afternoon.indices ?? [],
            isReady: s.afternoon.is_ready ?? false,
          }
        : { type: "afternoon" as const, time: "", headline: "준비 중", indices: [], isReady: false },
    }))
}

export function useBriefingLogs(): UseBriefingLogsReturn {
  const [allLogs, setAllLogs] = useState<DailyBriefingLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("briefings")
        .select("id, date, type, time, headline, indices, is_ready")
        .order("date", { ascending: false })

      if (!error && data) {
        setAllLogs(groupByDate(data as BriefingRow[]))
      }

      setIsLoading(false)
    }

    load()
  }, [])

  const logs = useMemo<DailyBriefingLog[]>(() => {
    return allLogs.filter((log) => {
      const withinRange =
        (!dateRange.start || log.id >= dateRange.start) &&
        (!dateRange.end || log.id <= dateRange.end)

      const matchesSearch =
        !searchQuery ||
        log.morning.headline.includes(searchQuery) ||
        log.afternoon.headline.includes(searchQuery)

      return withinRange && matchesSearch
    })
  }, [allLogs, searchQuery, dateRange])

  return { logs, isLoading, searchQuery, dateRange, setSearchQuery, setDateRange }
}
