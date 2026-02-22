"use client"

import { useState } from "react"
import { Eye, EyeOff, RefreshCw, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { Currency } from "@/types"
import { useAssetSummary } from "@/hooks/use-asset-data"

function formatKrw(value: number): string {
  return value.toLocaleString("ko-KR")
}

function formatUsd(krwValue: number, exchangeRate = 1_360): string {
  return (krwValue / exchangeRate).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function AssetTotalCard() {
  const [currency, setCurrency] = useState<Currency>("KRW")
  const [isHidden, setIsHidden] = useState(false)
  const { data, isLoading } = useAssetSummary()

  const displayAmount = !data
    ? "-"
    : currency === "KRW"
    ? formatKrw(data.totalKrw)
    : formatUsd(data.totalKrw)

  const isPositive = data ? data.changeStatus === "up" : false

  return (
    // 카드 전체를 Link로 감싸되, 상단 버튼들(블라인드/환율)의 클릭은
    // stopPropagation으로 막아서 두 가지 인터랙션이 충돌하지 않게 합니다.
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden group transition-all hover:shadow-md">

      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl" />

      {/* 상단 영역: 자산 정보 표시 */}
      <div className="p-7 pb-4 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Total Balance
            </span>
            {/* stopPropagation: 이 버튼 클릭이 카드 Link 이동으로 번지는 걸 막습니다 */}
            <button
              onClick={(e) => { e.preventDefault(); setIsHidden((v) => !v) }}
              aria-label={isHidden ? "자산 표시" : "자산 숨기기"}
              className="text-slate-300 hover:text-emerald-500 transition-colors"
            >
              {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={(e) => { e.preventDefault(); setCurrency((c) => (c === "KRW" ? "USD" : "KRW")) }}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-full transition-all active:scale-95"
          >
            <RefreshCw className="w-2.5 h-2.5 text-emerald-500" />
            <span className="text-[10px] font-black text-slate-600">{currency}</span>
          </button>
        </div>

        <div className="flex items-baseline mt-1 min-h-[40px]">
          {isHidden ? (
            <span className="text-2xl font-black tracking-widest text-slate-200">••••••••</span>
          ) : isLoading ? (
            <span className="text-2xl font-black text-slate-200 animate-pulse">로딩 중...</span>
          ) : (
            <>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">
                {displayAmount}
              </span>
              <span className="text-sm font-bold text-slate-400 ml-1.5 uppercase">
                {currency === "KRW" ? "원" : "usd"}
              </span>
            </>
          )}
        </div>

        {!isHidden && data && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${isPositive ? "bg-rose-50" : "bg-blue-50"}`}>
              <span className={`text-[10px] font-black ${isPositive ? "text-rose-500" : "text-blue-500"}`}>
                {isPositive ? "+" : ""}{data.monthlyChangeRate.toFixed(1)}%
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">지난달 대비</span>
          </div>
        )}
      </div>

      {/* 하단 히스토리 버튼 — 전체 너비, 충분한 패딩으로 누르기 편하게 */}
      <Link
        href="/assets/history"
        className="flex items-center justify-between px-7 py-4 border-t border-slate-50 bg-slate-50/50 hover:bg-emerald-50 active:bg-emerald-100 transition-all group/btn"
      >
        <span className="text-[11px] font-black text-slate-400 group-hover/btn:text-emerald-600 transition-colors">
          자산 변동 히스토리 보기
        </span>
        <div className="w-7 h-7 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover/btn:bg-emerald-500 group-hover/btn:border-emerald-500 transition-all shadow-sm">
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover/btn:text-white transition-colors" />
        </div>
      </Link>
    </div>
  )
}
