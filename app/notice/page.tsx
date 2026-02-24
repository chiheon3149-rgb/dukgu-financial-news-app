"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { supabase } from "@/lib/supabase"

interface Notice {
  id: string
  content: string
  link_url: string | null
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export default function NoticeListPage() {
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    supabase
      .from("notices")
      .select("id, content, link_url, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setNotices(data) })
  }, [])

  return (
    <div className="min-h-dvh bg-slate-50 pb-20">
      <DetailHeader title="공지사항" />

      <main className="p-4 space-y-3">
        {notices.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-16">공지사항이 없습니다</p>
        ) : (
          notices.map((notice) => {
            const href = notice.link_url ?? `/notice/${notice.id}`
            return (
              <Link
                key={notice.id}
                href={href}
                className="block bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <Bell className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{notice.content}</h2>
                    <p className="text-[11px] text-slate-400 font-medium">{formatDate(notice.created_at)}</p>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </main>
    </div>
  )
}
