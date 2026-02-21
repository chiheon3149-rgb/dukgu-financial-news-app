"use client"

import { TrendingUp, TrendingDown, Calendar, ChevronDown } from "lucide-react"

interface SummaryProps {
  label: string;
  diff: number;
  isPlus: boolean;
  onPickerOpen: () => void;
  isOpen: boolean;
  viewMode: string;
  onModeChange: (mode: any) => void;
}

export function HistorySummary({ label, diff, isPlus, onPickerOpen, isOpen, viewMode, onModeChange }: SummaryProps) {
  return (
    <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-visible">
      <div className="flex items-center justify-between mb-5 relative z-30">
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
          {["yesterday", "7days", "month"].map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                viewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
              }`}
            >
              {mode === "yesterday" ? "어제" : mode === "7days" ? "7일" : "한 달"}
            </button>
          ))}
        </div>

        <button 
          onClick={onPickerOpen}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${
            isOpen ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" : "bg-white border-slate-100 text-slate-500 shadow-sm"
          }`}
        >
          <Calendar className={`w-3.5 h-3.5 ${isOpen ? "text-white" : "text-emerald-500"}`} />
          <span className="text-[11px] font-black">날짜설정</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest opacity-80">{label}</p>
        <div className="flex items-center gap-2.5">
          <h2 className={`text-3xl font-black tracking-tighter ${isPlus ? "text-rose-500" : "text-blue-600"}`}>
            {isPlus ? "+" : ""} {diff.toLocaleString()}원
          </h2>
          <div className={`px-2.5 py-1 rounded-full flex items-center gap-1 border ${isPlus ? "bg-rose-50 border-rose-100" : "bg-blue-50 border-blue-100"}`}>
            {isPlus ? <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> : <TrendingDown className="w-3.5 h-3.5 text-blue-500" />}
            <span className={`text-[10px] font-black leading-none ${isPlus ? "text-rose-600" : "text-blue-600"}`}>
              {isPlus ? "성장 중" : "하락 중"}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}