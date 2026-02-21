"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Bell, ChevronRight } from "lucide-react"

export function NoticeDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 💡 백엔드에서 받아올 '최근 3개' 공지사항 샘플 데이터
  const recentNotices = [
    { id: 1, title: "[공지] 시스템 업데이트 작업 중입니다.", isNew: true },
    { id: 2, title: "[안내] 페이젠(PayZen) 결제 모듈 점검 안내", isNew: false },
    { id: 3, title: "[업데이트] 미국/한국 브리핑 모드 추가", isNew: false },
  ]

  // 💡 팝업 바깥을 클릭하면 서랍이 자동으로 닫히게 만드는 UX 디테일
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. 종소리 버튼 (누르면 서랍이 열리거나 닫힘) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-secondary transition-colors cursor-pointer"
        aria-label="알림"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
      </button>

      {/* 2. 팝업 창 (isOpen이 true일 때만 화면에 나타남) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          {/* 팝업 헤더 */}
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-800">최근 알림</span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">3건</span>
          </div>

          {/* 알림 리스트 3개 */}
          <div className="max-h-64 overflow-y-auto">
            {recentNotices.map((notice) => (
              <Link 
                key={notice.id} 
                href={`/notice/${notice.id}`} // 💡 누르면 해당 상세 페이지로 이동!
                onClick={() => setIsOpen(false)} // 누르면 팝업창 닫기
                className="block px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  {notice.isNew && (
                    <span className="mt-0.5 shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}
                  <p className={`text-xs leading-snug line-clamp-2 ${notice.isNew ? 'text-slate-800 font-semibold' : 'text-slate-600 font-medium'}`}>
                    {notice.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* 전체보기 버튼 (공지사항 리스트 페이지로 이동) */}
          <Link 
            href="/notice"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-1 w-full py-2.5 bg-white text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            전체 알림 보기 <ChevronRight className="w-3 h-3" />
          </Link>
          
        </div>
      )}
    </div>
  )
}