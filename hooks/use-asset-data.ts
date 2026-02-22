"use client"

import { useState, useCallback } from "react"
import type { AssetSummary, AssetCategory } from "@/types"
import { MOCK_ASSET_SUMMARY, MOCK_ASSET_CATEGORIES } from "@/lib/mock/assets"

// =============================================================================
// 💰 useAssetSummary 훅
//
// 역할: 총자산 요약 카드(AssetTotalCard)에 필요한 데이터를 제공합니다.
//
// 🔄 Supabase 전환 시: refresh 내부의 Mock 로직을
//    supabase.from('asset_summary').select('*').single() 으로 교체하면 됩니다.
// =============================================================================

interface UseAssetSummaryReturn {
  data: AssetSummary | null
  isLoading: boolean
  refresh: () => Promise<void>
}

export function useAssetSummary(): UseAssetSummaryReturn {
  const [data, setData] = useState<AssetSummary | null>(MOCK_ASSET_SUMMARY)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      // 🔄 TODO: const { data } = await supabase.from('asset_summary').select('*').single()
      await new Promise((r) => setTimeout(r, 600))
      setData(MOCK_ASSET_SUMMARY)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  return { data, isLoading, refresh }
}


// =============================================================================
// 💼 useAssetCategories 훅
//
// 역할: 자산 카테고리 리스트(주식, 부동산, 기타)를 제공합니다.
// assets/page.tsx 의 중복 JSX를 .map()으로 처리할 수 있게 해주는 데이터 소스입니다.
//
// 🔄 Supabase 전환 시: supabase.from('asset_categories').select('*') 로 교체.
// =============================================================================

interface UseAssetCategoriesReturn {
  categories: AssetCategory[]
  isLoading: boolean
}

export function useAssetCategories(): UseAssetCategoriesReturn {
  const [categories] = useState<AssetCategory[]>(MOCK_ASSET_CATEGORIES)
  const [isLoading] = useState(false)

  return { categories, isLoading }
}
