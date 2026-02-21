"use client"

import { useRef, useState } from "react"
import { Search, CalendarDays, X } from "lucide-react"

interface BriefingSearchBarProps {
  onSearch?: (value: string) => void;
  onRangeChange?: (start: string, end: string) => void;
}

export function BriefingSearchBar({ onSearch, onRangeChange }: BriefingSearchBarProps) {
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const [dates, setDates] = useState({ start: "", end: "" });

  const handleDateClick = () => {
    // 시작일이 없으면 시작일 먼저, 있으면 종료일을 엽니다.
    if (!dates.start) startRef.current?.showPicker();
    else if (!dates.end) endRef.current?.showPicker();
    else {
      // 이미 둘 다 있으면 초기화 후 다시 시작
      setDates({ start: "", end: "" });
      startRef.current?.showPicker();
    }
  };

  const resetDates = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDates({ start: "", end: "" });
    onRangeChange?.("", "");
  };

  return (
    <div className="space-y-3 mb-8">
      <div className="flex gap-2">
        {/* 1. 키워드 검색 (메인) */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="로그 키워드 검색"
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-[13px] focus:ring-2 focus:ring-emerald-500/10 outline-none font-medium placeholder:text-slate-300"
          />
        </div>

        {/* 2. 통합 달력 버튼 (하나로 처리!) */}
        <button 
          onClick={handleDateClick}
          className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${
            dates.start ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-slate-50 border-slate-100 text-slate-400"
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          
          {/* 숨겨진 실제 인풋들 */}
          <input 
            ref={startRef} 
            type="date" 
            className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
            onChange={(e) => {
              setDates(prev => ({ ...prev, start: e.target.value }));
              endRef.current?.showPicker(); // 시작일 선택하면 바로 종료일 팝업
            }}
          />
          <input 
            ref={endRef} 
            type="date" 
            className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
            onChange={(e) => {
              setDates(prev => ({ ...prev, end: e.target.value }));
              onRangeChange?.(dates.start, e.target.value);
            }}
          />
        </button>
      </div>

      {/* 3. 기간 표시 칩 (날짜가 선택되었을 때만 등장) */}
      {dates.start && (
        <div className="flex animate-in fade-in slide-in-from-top-1">
          <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-2 border border-emerald-100">
            <span>{dates.start} {dates.end ? `~ ${dates.end}` : "(종료일 선택 중...)"}</span>
            <X className="w-3 h-3 cursor-pointer hover:text-emerald-800" onClick={resetDates} />
          </div>
        </div>
      )}
    </div>
  );
}