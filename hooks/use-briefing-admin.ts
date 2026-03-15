"use client"

import { useCallback } from "react"

export function useBriefingAdmin() {

  const saveBriefing = useCallback(async (data: any) => {
    const contentJson = {
      kpis: data.kpis || [],
      markets: data.markets || [],
      schedule: data.schedule || [],
      news: data.news_items || [],
      summary: data.summary_data?.summary || "",
      quote: data.summary_data?.quote || "",
      quoteAuthor: data.summary_data?.author || ""
    }

    const briefingData = {
      date: data.date,
      type: data.type,
      time: data.time,
      headline: data.headline,
      indices: data.indices || null,
      content: contentJson,
      is_ready: true,
    }

    const res = await fetch("/api/admin/briefing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(briefingData),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "저장 실패")
    return json.data
  }, [])

  const clearBriefing = useCallback(async (date: string, type: "morning" | "afternoon") => {
    const res = await fetch("/api/admin/briefing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        type,
        headline: "준비 중",
        indices: null,
        content: null,
        is_ready: false,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "초기화 실패")
  }, [])

  return { saveBriefing, clearBriefing }
}
