"use client"

import { useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function useBriefingAdmin() {
  
  const saveBriefing = useCallback(async (data: any) => {
    // 💡 [핵심] 기획자님의 SQL 구조와 동일하게 'content' JSON 조립하기!
    const contentJson = {
      kpis: data.kpis || [],           // KPI 트래커 데이터
      markets: data.markets || [],     // 마켓 인덱스 보드 데이터
      schedule: data.schedule || [],   // 스케줄 데이터
      news: data.news_items || [],     // 뉴스 아이템 데이터
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
      content: contentJson, // 👈 뭉쳐진 거대 JSON을 content 칸에 쏙!
      is_ready: true,
    }

    const { data: saved, error } = await supabase
      .from("briefings")
      .upsert(briefingData, { onConflict: 'date, type' })
      .select("id")
      .single()

    if (error) throw error
    return saved
  }, [])

  const clearBriefing = useCallback(async (date: string, type: "morning" | "afternoon") => {
    const { error } = await supabase
      .from("briefings")
      .update({
        headline: "준비 중",
        indices: null,
        content: null, // 내용 통째로 비우기
        is_ready: false,
      })
      .eq("date", date)
      .eq("type", type)

    if (error) throw error
  }, [])

  return { saveBriefing, clearBriefing }
}