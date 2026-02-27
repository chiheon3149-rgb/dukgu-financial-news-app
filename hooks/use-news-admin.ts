"use client"

import { useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function useNewsAdmin() {
  
  // 1. 💡 뉴스 등록 도구 (create)
  const createNews = useCallback(async (data: any) => {
    // 뉴스 테이블에 들어갈 기본값(조회수, 좋아요 등 0으로 초기화) 세팅
    const newsData = {
      ...data,
      view_count: 0,
      good_count: 0,
      bad_count: 0,
      comment_count: 0,
      published_at: new Date().toISOString(), // 작성 시간 자동 기입
    }

    const { data: inserted, error } = await supabase
      .from("news")
      .insert(newsData)
      .select("id")
      .single()

    if (error) throw error
    return inserted // 👈 등록 성공하면 새 뉴스의 ID를 반환해서 바로 이동할 수 있게 해줍니다.
  }, [])

  // 2. 💡 뉴스 수정 도구 (update)
  const updateNews = useCallback(async (newsId: string, data: any) => {
    const { error } = await supabase
      .from("news")
      .update(data)
      .eq("id", newsId)

    if (error) throw error
  }, [])

  // 3. 💡 뉴스 삭제 도구 (delete)
  const deleteNews = useCallback(async (newsId: string) => {
    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", newsId)

    if (error) throw error
  }, [])

  return { createNews, updateNews, deleteNews }
}