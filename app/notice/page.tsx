"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"

const noticeData = [
  { id: 1, title: "[공지] 시스템 업데이트 작업 중입니다.", date: "2026.02.21", isNew: true },
  { id: 2, title: "[안내] 페이젠(PayZen) 결제 모듈 점검 안내", date: "2026.02.15", isNew: false },
  { id: 3, title: "[업데이트] 미국/한국 브리핑 모드 추가", date: "2026.02.10", isNew: false },
]

export default function NoticeListPage() {
  return (
    <div className="min-h-dvh bg-slate-50 pb-20">
      
      {/* 💡 기획자님의 UX 규칙 적용: 2 Depth이므로 우측 홈 버튼(rightElement)을 제거하고 깔끔하게 제목만 남겼습니다. */}
      <DetailHeader title="공지사항" />

      {/* 리스트 영역 */}
      <main className="p-4 space-y-3">
        {noticeData.map((notice) => (
          <Link key={notice.id} href={`/notice/${notice.id}`} className="block bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Bell className={`w-4 h-4 ${notice.isNew ? 'text-blue-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {notice.isNew && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold rounded">NEW</span>}
                  <h2 className="text-sm font-bold text-slate-800 line-clamp-1">{notice.title}</h2>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">{notice.date}</p>
              </div>
            </div>
          </Link>
        ))}
      </main>
    </div>
  )
}