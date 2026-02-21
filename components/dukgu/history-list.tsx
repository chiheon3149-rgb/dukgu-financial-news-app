"use client"

import React, { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Minus, ChevronDown } from "lucide-react"

interface HistoryItem {
  date: string
  total: number
  change: number
  status: string
}

export function HistoryList({ data }: { data: HistoryItem[] }) {
  // 🚀 기획 포인트: 현재 화면에 보여줄 아이템 개수 상태 (기본 10개)
  const [displayCount, setDisplayCount] = useState(10)

  // 💡 필터가 바뀌어서 데이터가 새로 들어오면 다시 10개부터 보여주도록 리셋
  useEffect(() => {
    setDisplayCount(10)
  }, [data])

  // 실제로 화면에 그릴 데이터는 전체 데이터에서 0번부터 displayCount까지만 자릅니다.
  const visibleData = data.slice(0, displayCount)
  const hasMore = data.length > displayCount

  return (
    <section className="space-y-4 relative z-0">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
          일별 자산 기록
        </h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/50 rounded-lg">
          <span className="text-[9px] font-black text-slate-500 tracking-tighter">00:00 기준 기록</span>
        </div>
      </div>

      <div className="grid gap-3">
        {visibleData.map((item, idx) => {
          const prevTotal = item.total - item.change
          const percentage = prevTotal !== 0 ? (item.change / prevTotal) * 100 : 0
          
          return (
            <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-slate-400">{item.date.replace(/-/g, ".")}</p>
                <p className="text-[15px] font-black text-slate-800">{item.total.toLocaleString()}원</p>
              </div>

              <div className="text-right space-y-1">
                <div className={`flex items-center justify-end gap-1.5 font-black text-[13px] ${
                  item.status === 'up' ? 'text-rose-500' : item.status === 'down' ? 'text-blue-500' : 'text-slate-400'
                }`}>
                  {item.change > 0 ? "+" : ""}{item.change.toLocaleString()}원
                </div>

                <div className={`flex items-center justify-end gap-1 px-2 py-0.5 rounded-full inline-flex ${
                  item.status === 'up' ? 'bg-rose-50 text-rose-600' : 
                  item.status === 'down' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  {item.status === 'up' && <TrendingUp className="w-2.5 h-2.5" />}
                  {item.status === 'down' && <TrendingDown className="w-3 h-3" />}
                  {item.status === 'same' && <Minus className="w-2.5 h-2.5" />}
                  <span className="text-[10px] font-black leading-none">
                    {percentage > 0 ? "+" : ""}{percentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {/* 🚀 [NEW] 더 보기 버튼: 남은 데이터가 있을 때만 나타납니다 */}
        {hasMore && (
          <button 
            onClick={() => setDisplayCount(prev => prev + 10)}
            className="w-full mt-2 py-4 flex items-center justify-center gap-2 bg-slate-100/50 hover:bg-slate-100 text-slate-500 rounded-[20px] transition-all active:scale-95"
          >
            <span className="text-[12px] font-black">이전 기록 10개 더 보기</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
        
        {data.length === 0 && (
          <div className="py-20 text-center text-slate-300 font-bold text-sm bg-white rounded-[28px] border border-dashed border-slate-200">
            해당 기간의 기록이 존재하지 않는다냥! 🐾
          </div>
        )}
      </div>
    </section>
  )
}