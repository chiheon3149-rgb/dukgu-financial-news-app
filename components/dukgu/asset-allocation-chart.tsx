"use client"

import React, { useState } from "react"
import { PieChart, TrendingUp } from "lucide-react"

export function AssetAllocationChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const allocations = [
    { id: 0, label: "부동산", percent: 50, color: "bg-indigo-500", hex: "#6366f1", glow: "shadow-indigo-500/20" },
    { id: 1, label: "주식", percent: 30, color: "bg-emerald-500", hex: "#10b981", glow: "shadow-emerald-500/20" },
    { id: 2, label: "금", percent: 10, color: "bg-amber-400", hex: "#fbbf24", glow: "shadow-amber-400/20" },
    { id: 3, label: "채권", percent: 5, color: "bg-blue-400", hex: "#60a5fa", glow: "shadow-blue-400/20" },
    { id: 4, label: "현금", percent: 5, color: "bg-slate-300", hex: "#cbd5e1", glow: "shadow-slate-300/20" },
  ]

  const radius = 35
  const circumference = 2 * Math.PI * radius
  let cumulativePercent = 0

  return (
    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 mt-6 relative overflow-hidden">
      {/* 배경 장식 (글래스모피즘 느낌 극대화) */}
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="flex items-center gap-2.5 font-black text-[16px] text-slate-800 tracking-tight">
          <div className="p-1.5 bg-emerald-50 rounded-lg">
            <PieChart className="w-4 h-4 text-emerald-500" />
          </div>
          포트폴리오 비중
        </h3>
        <div className="flex items-center gap-1.5 bg-white shadow-sm border border-slate-100 px-2.5 py-1 rounded-full">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Stable</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 relative z-10">
        
        {/* 🚀 왼쪽: 리퀴드 글래스 도넛 차트 */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          {/* 차트 광택 효과를 위한 필터 정의 */}
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-sm">
            <defs>
              <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            {allocations.map((item) => {
              const startPercent = cumulativePercent
              cumulativePercent += item.percent
              const offset = circumference - (circumference * item.percent) / 100
              const rotation = (startPercent / 100) * 360
              const isSelected = activeIndex === item.id

              return (
                <circle
                  key={item.id}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={item.hex}
                  strokeWidth={isSelected ? "12" : "8"}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round" // 💡 리퀴드 느낌을 주는 둥근 끝처리
                  transform={`rotate(${rotation} 50 50)`}
                  className="transition-all duration-500 ease-out"
                  style={{ 
                    opacity: activeIndex === null || isSelected ? 1 : 0.2,
                    filter: isSelected ? `drop-shadow(0 0 8px ${item.hex}44)` : 'none'
                  }}
                />
              )
            })}
            {/* 중앙 빈 공간: 뉴모피즘 스타일 */}
            <circle cx="50" cy="50" r="24" fill="white" className="shadow-inner" />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ratio</span>
            <span className="text-[20px] font-black text-slate-900 tracking-tighter">
              {activeIndex !== null ? `${allocations[activeIndex].percent}%` : "100"}
            </span>
          </div>
        </div>

        {/* 🚀 오른쪽: 프로페셔널 태그 리스트 */}
        <div className="flex-1 space-y-2">
          {allocations.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(activeIndex === item.id ? null : item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[16px] transition-all duration-300 border ${
                activeIndex === item.id 
                  ? `bg-slate-900 border-slate-900 shadow-lg ${item.glow} -translate-x-1` 
                  : "bg-white/50 border-slate-100/80 hover:border-emerald-200 hover:bg-white text-slate-600 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                <span className={`text-[11px] font-bold tracking-tight ${activeIndex === item.id ? "text-white" : "text-slate-600"}`}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[12px] font-black ${activeIndex === item.id ? "text-emerald-400" : "text-slate-900"}`}>
                  {item.percent}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}