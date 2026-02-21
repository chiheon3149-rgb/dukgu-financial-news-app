"use client"

import React from "react"
import { Clock, ChevronRight, TrendingUp, TrendingDown } from "lucide-react"

// 1. 데이터 규격
interface IndexSummary {
  name: string;
  change: string;
}

interface BriefingLogCardProps {
  type: "morning" | "afternoon";
  time: string;
  headline: string;
  indices?: IndexSummary[];
  onClick?: () => void;
}

// 2. 컴포넌트 시작
export function BriefingLogCard({ 
  type, 
  time, 
  headline, 
  indices = [], 
  onClick 
}: BriefingLogCardProps) {
  const isMorning = type === "morning";
  
  return (
    <button 
      onClick={onClick}
      className="flex flex-col p-5 bg-white hover:bg-emerald-50 rounded-[20px] transition-all group w-full text-left border border-slate-100 hover:border-emerald-100 shadow-sm hover:shadow-md mb-1"
    >
      {/* 1. 상단: 배지 & 시간 */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
          isMorning ? "bg-blue-50 text-blue-500" : "bg-red-50 text-red-500"
        }`}>
          {isMorning ? "Morning" : "Afternoon"}
        </span>
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-0.5">
          <Clock className="w-3 h-3" /> {time}
        </span>
      </div>

      {/* 2. 중간: 헤드라인 */}
      <div className="flex justify-between items-start gap-4 mb-5">
        <h3 className="text-[15px] font-bold text-slate-800 leading-snug break-keep flex-1">
          {headline}
        </h3>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 shrink-0 mt-0.5 transition-transform group-active:translate-x-1" />
      </div>

      {/* 3. 하단: 2x2 미니 지표 로그 */}
      {indices && indices.length > 0 && (
        <div className="pt-4 border-t border-slate-100 w-full">
          <div className="grid grid-cols-2 gap-2">
            {indices.map((idx, i) => {
              const changeText = idx?.change || "";
              const nameText = idx?.name || "";
              const isPlus = changeText.includes('+');
              const colorClass = isPlus ? 'text-rose-500 bg-rose-50' : 'text-blue-500 bg-blue-50';
              
              return (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100/50">
                  <div className={`p-1.5 rounded-lg ${colorClass} shrink-0`}>
                    {isPlus ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 leading-none mb-1">{nameText}</span>
                    <span className={`text-[12px] font-black leading-none ${isPlus ? 'text-rose-600' : 'text-blue-600'}`}>
                      {changeText}
                    </span>
                  </div>
                </div>
              ); // <-- 여기서 괄호가 닫힙니다 (중요!)
            })}
          </div>
        </div>
      )}
    </button> // <-- 버튼 닫는 태그 (이게 없어서 에러가 났을 확률이 높습니다!)
  ); // <-- return문 닫기
} // <-- 함수 닫기