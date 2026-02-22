import type { AssetSummary, AssetCategory, AssetHistoryItem } from "@/types"

// =============================================================================
// 💰 자산 목(Mock) 데이터
// 나중에 Supabase API 호출로 교체될 자리입니다.
// useAssetSummary, useAssetHistory 훅 외에는 이 파일을 직접 import하지 않습니다.
// =============================================================================

export const MOCK_ASSET_SUMMARY: AssetSummary = {
  totalKrw: 850_000_000,
  totalUsd: 625_000,
  monthlyChangeRate: 2.4,
  changeStatus: "up",
  updatedAt: "2026-02-22T09:30:00+09:00",
}

export const MOCK_ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: "stocks",
    name: "국내/해외 주식",
    description: "24개 종목 보유 중",
    icon: "TrendingUp",
    colorTheme: "emerald",
    valueKrw: 255_000_000,
    changeRate: 12.4,
    changeStatus: "up",
  },
  {
    id: "realestate",
    name: "부동산/분양권",
    description: "검단신도시 푸르지오 등",
    icon: "Landmark",
    colorTheme: "indigo",
    valueKrw: 425_000_000,
    changeRate: 0,
    changeStatus: "same",
  },
  {
    id: "etc",
    name: "기타 자산",
    description: "금, 현금, 채권 등",
    icon: "Coins",
    colorTheme: "amber",
    valueKrw: 170_000_000,
    changeRate: 0.8,
    changeStatus: "up",
  },
]

/** 최근 60일치 자산 히스토리를 생성합니다. */
function generateMockHistory(): AssetHistoryItem[] {
  const items: AssetHistoryItem[] = []
  let total = 850_000_000

  for (let i = 0; i < 60; i++) {
    const date = new Date("2026-02-22")
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    // 현실감 있는 일별 변동 시뮬레이션 (-1.5% ~ +1.5%)
    const changeRate = (Math.random() - 0.5) * 0.03
    const changeKrw = Math.round(total * changeRate)
    const prevTotal = total
    total = Math.max(total - changeKrw, 500_000_000)

    const changeStatus =
      changeKrw > 0 ? "up" : changeKrw < 0 ? "down" : "same"

    items.push({
      date: dateStr,
      totalKrw: prevTotal,
      changeKrw,
      changeStatus,
    })
  }

  return items
}

export const MOCK_ASSET_HISTORY: AssetHistoryItem[] = generateMockHistory()
