"use client"

import { useState } from "react"
import { Eye, EyeOff, ChevronRight, RefreshCw } from "lucide-react"
import Link from "next/link"

export function AssetTotalCard() {
  const [currency, setCurrency] = useState<"KRW" | "USD">("KRW")
  const [isHidden, setIsHidden] = useState(false)

  const totalKrw = "850,000,000"
  const totalUsd = "625,000.00"

  return (
    // 🚀 relative를 줘서 내부의 '스티커(absolute)' 버튼이 위치를 잡게 합니다.
    <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden group transition-all hover:shadow-md min-h-[170px]">
      
      {/* 배경 디자인 */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl transition-colors" />

      <div className="flex flex-col gap-1 relative z-10">
        {/* 1. 상단: 타이틀 & 화폐 스위치 (간섭 없음) */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Balance</span>
            <button onClick={() => setIsHidden(!isHidden)} className="text-slate-300 hover:text-emerald-500">
              {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <button 
            onClick={() => setCurrency(prev => prev === "KRW" ? "USD" : "KRW")}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-full"
          >
            <RefreshCw className="w-2.5 h-2.5 text-emerald-500" />
            <span className="text-[10px] font-black text-slate-600">{currency}</span>
          </button>
        </div>

        {/* 🚀 2. 금액 영역: mt-1 등으로 간격을 자유롭게 조절하세요. 버튼과 독립적입니다! */}
        <div className="flex items-baseline mt-1">
          {isHidden ? (
            <span className="text-2xl font-black tracking-widest text-slate-200">••••••••</span>
          ) : (
            <>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">
                {currency === "KRW" ? totalKrw : totalUsd}
              </span>
              <span className="text-sm font-bold text-slate-400 ml-1.5 uppercase">
                {currency === "KRW" ? "원" : "usd"}
              </span>
            </>
          )}
        </div>

        {/* 3. 하단: 변동률 정보 */}
        {!isHidden && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 rounded-md">
              <span className="text-[10px] font-black text-rose-500">+2.4%</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">지난달 대비</span>
          </div>
        )}
      </div>

      {/* 🚀 4. 상세가기 버튼: '스티커(absolute)' 방식! 금액과 상관없이 우측 하단에 고정 */}
      <Link 
        href="/assets/history" 
        className="absolute bottom-6 right-6 bg-slate-50 p-3 rounded-2xl group-hover:bg-emerald-500 transition-all active:scale-90 shadow-sm"
      >
        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
      </Link>
    </div>
  )
}