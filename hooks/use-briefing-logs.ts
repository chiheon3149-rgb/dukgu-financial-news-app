"use client"

import { useState, useMemo } from "react"
import type { DailyBriefingLog } from "@/types"
import { MOCK_BRIEFING_LOGS } from "@/lib/mock/briefings"

// =============================================================================
// ⚡ useBriefingLogs 훅
//
// 역할: 브리핑 로그 목록 + 검색/날짜 필터링 로직을 담당합니다.
// briefing/page.tsx 에서 직접 관리하던 상태와 useMemo 로직을 이곳으로 이전합니다.
//
// 🔄 Supabase 전환 시: MOCK_BRIEFING_LOGS 를
//    supabase.from('briefing_logs').select('*, sessions(*)') 결과로 교체.
// =============================================================================

interface DateRange {
  start: string
  end: string
}

interface UseBriefingLogsReturn {
  logs: DailyBriefingLog[]
  searchQuery: string
  dateRange: DateRange
  setSearchQuery: (q: string) => void
  setDateRange: (range: DateRange) => void
}

export function useBriefingLogs(): UseBriefingLogsReturn {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" })

  const logs = useMemo<DailyBriefingLog[]>(() => {
    return MOCK_BRIEFING_LOGS.filter((log) => {
      const withinRange =
        (!dateRange.start || log.id >= dateRange.start) &&
        (!dateRange.end || log.id <= dateRange.end)

      const matchesSearch =
        !searchQuery ||
        log.morning.headline.includes(searchQuery) ||
        log.afternoon.headline.includes(searchQuery)

      return withinRange && matchesSearch
    })
  }, [searchQuery, dateRange])

  return { logs, searchQuery, dateRange, setSearchQuery, setDateRange }
}
