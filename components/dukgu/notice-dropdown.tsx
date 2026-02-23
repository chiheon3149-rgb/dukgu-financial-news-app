"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Bell, ChevronRight, X } from "lucide-react"

// =============================================================================
// 🔔 NoticeDropdown — 알림 드롭다운
//
// - 데스크톱: 벨 아이콘 아래 absolute 팝업
// - 모바일(sm 이하): 화면 중앙 고정(fixed) 오버레이로 표시
// - 열리는 순간 읽은 상태로 처리 → 빨간 뱃지 사라짐
// =============================================================================

// 💡 Supabase 연결 시 API로 교체할 샘플 데이터
const SAMPLE_NOTICES = [
  { id: 1, title: "[공지] 시스템 업데이트 작업 중입니다.", isNew: true },
  { id: 2, title: "[안내] 페이젠(PayZen) 결제 모듈 점검 안내", isNew: false },
  { id: 3, title: "[업데이트] 미국/한국 브리핑 모드 추가", isNew: false },
]

export function NoticeDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(
    SAMPLE_NOTICES.some((n) => n.isNew)
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 열리는 순간 읽음 처리
  const handleOpen = () => {
    setIsOpen(true)
    setHasUnread(false)
  }

  // 데스크톱: 팝업 바깥 클릭 시 닫기
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
      {/* 벨 버튼 */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-secondary transition-colors cursor-pointer"
        aria-label="알림"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        )}
      </button>

      {/* 팝업 */}
      {isOpen && (
        <>
          {/* 모바일 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/30 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* 드롭다운 본문
              - 모바일: fixed로 화면 중앙 하단 표시
              - 데스크톱: absolute right-0 팝업 */}
          <div className="
            fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50
            sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:translate-y-0 sm:translate-x-0 sm:mt-2 sm:w-72
            bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
          ">
            {/* 헤더 */}
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800">최근 알림</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                  {SAMPLE_NOTICES.length}건
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-200 transition-colors sm:hidden"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* 알림 리스트 */}
            <div className="max-h-64 overflow-y-auto">
              {SAMPLE_NOTICES.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/notice/${notice.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {notice.isNew && (
                      <span className="mt-0.5 shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                    <p className={`text-xs leading-snug line-clamp-2 ${notice.isNew ? "text-slate-800 font-semibold" : "text-slate-600 font-medium"}`}>
                      {notice.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* 전체보기 */}
            <Link
              href="/notice"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1 w-full py-2.5 bg-white text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              전체 알림 보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
