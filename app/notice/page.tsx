"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, ChevronRight } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { supabase } from "@/lib/supabase"

interface Notice {
  id: string
  title: string
  content: string
  category: string | null
  link_url: string | null
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

const CATEGORY_LABEL: Record<string, string> = {
  notice: "공지",
  update: "업데이트",
  guide: "안내",
}

export default function NoticeListPage() {
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    supabase
      .from("notices")
      .select("id, title, content, category, link_url, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setNotices(data) })
  }, [])

  return (
    <div className="min-h-dvh bg-slate-50 pb-20">
      <DetailHeader title="공지사항" />

      <main className="max-w-md mx-auto p-4 space-y-3">
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Bell className="w-10 h-10 text-slate-400 mb-3" />
            <p className="text-sm font-bold text-slate-500">등록된 공지사항이 없습니다</p>
          </div>
        ) : (
          notices.map((notice) => {
            const href = notice.link_url ?? `/notice/${notice.id}`
            const categoryLabel = notice.category ? (CATEGORY_LABEL[notice.category] ?? notice.category) : null
            
            return (
              <Link
                key={notice.id}
                href={href}
                className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-emerald-200 transition-all group active:scale-[0.98]"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="bg-emerald-50 p-2 rounded-full shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <Bell className="w-4 h-4 text-emerald-500" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {categoryLabel && (
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black tracking-tight rounded-md shrink-0">
                          {categoryLabel}
                        </span>
                      )}
                      <h2 className="text-[14px] font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {notice.title}
                      </h2>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">{formatDate(notice.created_at)}</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 shrink-0 ml-2 transition-colors" />
              </Link>
            )
          })
        )}
      </main>
    </div>
  )
}