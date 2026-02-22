// "use client" 없음 → 서버 컴포넌트로 동작합니다.
// 이 컴포넌트는 props를 받아 화면에 그리는 역할만 합니다.
// 데이터가 어디서 오는지, 상태가 어떻게 관리되는지 전혀 알지 못합니다.

import { TrendingUp, TrendingDown, Landmark, Coins, ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import type { AssetCategory } from "@/types"
import { ASSET_THEMES } from "@/lib/constants/asset-themes"

// =============================================================================
// 🗺️ 아이콘 문자열 → Lucide 컴포넌트 매핑
//
// 데이터(Mock 또는 DB)에서는 아이콘 이름을 "TrendingUp" 같은 문자열로 저장합니다.
// React는 문자열을 직접 컴포넌트로 렌더링할 수 없으므로,
// 이 맵을 통해 문자열 → 실제 컴포넌트로 변환합니다.
// =============================================================================
const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  TrendingDown,
  Landmark,
  Coins,
}

interface AssetCategoryCardProps {
  category: AssetCategory
}

export function AssetCategoryCard({ category }: AssetCategoryCardProps) {
  const theme = ASSET_THEMES[category.colorTheme] ?? ASSET_THEMES.emerald
  const Icon = ICON_MAP[category.icon] ?? TrendingUp

  // 변동률 표시 텍스트 계산
  const rateDisplay =
    category.changeStatus === "same"
      ? "변동없음"
      : `${category.changeRate > 0 ? "+" : ""}${category.changeRate.toFixed(1)}%`

  const rateColorClass =
    category.changeStatus === "up"
      ? theme.rateUp
      : category.changeStatus === "down"
      ? theme.rateDown
      : "text-slate-400"

  return (
    // stocks → /assets/stocks, realestate → /assets/realestate 라우팅으로 연결
    <Link
      href={`/assets/${category.id}`}
      className={`flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm ${theme.hoverBorder} transition-all group active:scale-[0.98]`}
    >
      {/* 좌측: 아이콘 + 이름 */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${theme.iconBg} rounded-2xl flex items-center justify-center ${theme.iconColor} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-[15px] font-black text-slate-800">{category.name}</h3>
          <p className="text-[11px] font-bold text-slate-400">{category.description}</p>
        </div>
      </div>

      {/* 우측: 금액 + 변동률 + 화살표 */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[14px] font-black text-slate-800">
            {category.valueKrw.toLocaleString("ko-KR")}원
          </p>
          <p className={`text-[11px] font-bold ${rateColorClass}`}>{rateDisplay}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
      </div>
    </Link>
  )
}
