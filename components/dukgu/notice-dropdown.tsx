"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Bell, ChevronRight, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Notice {
  id: string
  content: string
  link_url: string | null
  created_at: string
}

const NOTICES_READ_KEY = "dukgu:notices-read-ids"

function getReadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(NOTICES_READ_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveReadIds(ids: string[]) {
  try {
    localStorage.setItem(NOTICES_READ_KEY, JSON.stringify(ids))
  } catch {}
}

export function NoticeDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notices, setNotices] = useState<Notice[]>([])
  const [hasUnread, setHasUnread] = useState(false)
  const [readIds, setReadIds] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Supabase에서 공지 불러오기
  useEffect(() => {
    supabase
      .from("notices")
      .select("id, content, link_url, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data?.length) return
        setNotices(data)
        const stored = getReadIds()
        setReadIds(stored)
        setHasUnread(data.some((n) => !stored.includes(n.id)))
      })
  }, [])

  // 열리는 순간 전체 읽음 처리
  const handleOpen = () => {
    setIsOpen(true)
    setHasUnread(false)
    const prev = getReadIds()
    const next = Array.from(new Set([...prev, ...notices.map((n) => n.id)]))
    saveReadIds(next)
    setReadIds(next)
  }

  // 바깥 클릭 시 닫기
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

          <div className="
            fixed left-4 right-4 top-16 z-50
            sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-72 sm:mt-2
            bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
          ">
            {/* 헤더 */}
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800">최근 알림</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                  {notices.length}건
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
              {notices.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">새 공지사항이 없습니다</p>
              ) : (
                notices.map((notice) => {
                  const isUnread = !readIds.includes(notice.id)
                  const href = notice.link_url ?? "/notice"
                  return (
                    <Link
                      key={notice.id}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {isUnread && (
                          <span className="mt-0.5 shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        )}
                        <p className={`text-xs leading-snug line-clamp-2 ${isUnread ? "text-slate-800 font-semibold" : "text-slate-600 font-medium"}`}>
                          {notice.content}
                        </p>
                      </div>
                    </Link>
                  )
                })
              )}
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
