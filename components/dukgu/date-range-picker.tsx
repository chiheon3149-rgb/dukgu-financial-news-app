"use client"

import React, { useState } from "react"
import { Check, ArrowRight } from "lucide-react"

interface DateRangePickerProps {
  range: { start: string; end: string }
  onApply: (range: { start: string; end: string }) => void
}

export function DateRangePicker({ range, onApply }: DateRangePickerProps) {
  const [tempRange, setTempRange] = useState(range)

  return (
    <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-5 z-50 animate-in fade-in slide-in-from-top-2">
      <p className="text-[11px] font-black text-slate-400 mb-4 uppercase tracking-widest">기간 설정</p>
      <div className="flex flex-col gap-4 text-left">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-slate-400 ml-1">시작일</span>
          <input 
            type="date" 
            value={tempRange.start}
            onChange={(e) => setTempRange(prev => ({ ...prev, start: e.target.value }))}
            className="bg-slate-50 border-none rounded-xl px-3 py-2.5 text-xs font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-slate-400 ml-1">종료일</span>
          <input 
            type="date" 
            value={tempRange.end}
            onChange={(e) => setTempRange(prev => ({ ...prev, end: e.target.value }))}
            className="bg-slate-50 border-none rounded-xl px-3 py-2.5 text-xs font-black text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>
        <button 
          onClick={() => onApply(tempRange)}
          className="mt-2 bg-slate-900 text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Check className="w-4 h-4" /> 적용하기
        </button>
      </div>
    </div>
  )
}