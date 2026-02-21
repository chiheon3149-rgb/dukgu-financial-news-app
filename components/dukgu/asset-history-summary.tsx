"use client"

import React, { useState } from "react"
import { TrendingUp, TrendingDown, Calendar, ChevronDown } from "lucide-react"

export function AssetHistorySummary() {
  // 💡 기획자님의 니즈: 버튼 클릭 시 상태 변경
  const [period, setPeriod] = useState<"yesterday" | "7days" | "month">("yesterday")

  // 💡 임시 데이터 (나중에 DB 수치와 연동)
  const dataMap = {
    yesterday: { amount: 500000, label: "전일 자정 대비" },
    "7days": { amount: 490000, label: "최근 7일 평균 증감" },
    month: { amount: -1200000, label: "이번 달 누적 증감" },
  }

  const currentData = dataMap[period]
  const isPlus = currentData.amount > 0

  return (
    <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group transition-all">
      {/* 배경 장식 (상태에 따라 아이콘과 색상 변화) */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        {isPlus ? (
          <TrendingUp className="w-20 h-20 text-rose-500" />
        ) : (
          <TrendingDown className="w-20 h-20 text-blue-500" />
        )}
      </div>

      {/* 🚀 상단: 기간 스위처 버튼 & 날짜 설정 */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
          {[
            { id: "yesterday", label: "어제" },
            { id: "7days", label: "최근 7일" },
            { id: "month", label: "이번 달" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                period === item.id 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1 text-slate-400 hover:text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
          <Calendar className="w-3.5 h-3.5" />
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* 🚀 하단: 금액 표시 (조건부 컬러링) */}
      <div className="relative z-10">
        <p className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
          {currentData.label}
        </p>
        
        <div className="flex items-end gap-2">
          <h2 className={`text-3xl font-black tracking-tighter transition-colors ${isPlus ? "text-rose-500" : "text-blue-500"}`}>
            {isPlus ? "+" : ""} {currentData.amount.toLocaleString()}원
          </h2>
          
          <div className={`px-2 py-0.5 rounded-md mb-1.5 transition-colors ${isPlus ? "bg-rose-50" : "bg-blue-50"}`}>
            <span className={`text-[10px] font-black ${isPlus ? "text-rose-600" : "text-blue-600"}`}>
              {isPlus ? "성장 중" : "하락 중"}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}