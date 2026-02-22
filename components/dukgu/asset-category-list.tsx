"use client"

// =============================================================================
// 📋 AssetCategoryList
//
// 이 파일이 "use client" 경계선입니다.
// 훅(useAssetCategories)을 사용하므로 반드시 클라이언트 컴포넌트여야 합니다.
//
// 설계 의도: assets/page.tsx 는 서버 컴포넌트로 유지하면서,
// 상태가 필요한 이 컴포넌트만 클라이언트 경계 안으로 격리합니다.
// 마치 건물 전체가 전기를 쓰는 게 아니라, 플러그가 꽂힌 방만 전기를 쓰는 것처럼요.
// =============================================================================

import { Plus, TrendingUp } from "lucide-react"
import { useAssetCategories } from "@/hooks/use-asset-data"
import { AssetCategoryCard } from "./asset-category-card"

export function AssetCategoryList() {
  const { categories, isLoading } = useAssetCategories()

  // 로딩 스켈레톤: 데이터가 오기 전 레이아웃 자리를 잡아줍니다
  if (isLoading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[82px] bg-slate-100 rounded-[28px] animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-300">
        <TrendingUp className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm font-bold">등록된 자산이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {/* 기존에 3번 복사하던 JSX가 한 줄의 .map()으로 대체됩니다.
          이제 자산 카테고리가 1개가 되든 10개가 되든 코드 변경이 필요 없습니다. */}
      {categories.map((category) => (
        <AssetCategoryCard key={category.id} category={category} />
      ))}
    </div>
  )
}
