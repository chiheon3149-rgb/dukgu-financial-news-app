"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Notice {
  id: string
  title: string
  link_url: string | null
}

export function NoticeBanner() {
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    supabase
      .from("notices")
      .select("id, title, link_url")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setNotice(data)
      })
  }, [])

  if (!notice) return null

  return (
    // 💡 [핵심] 외부 링크 유무를 무시하고 무조건 "/notice"로 이동하게 고정했습니다!
    <Link href="/notice" className="block">
      <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition-all hover:bg-emerald-100/50 cursor-pointer active:scale-[0.98]">
        <Bell className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
        <p className="text-[13px] font-bold text-emerald-900 leading-snug tracking-tight truncate flex-1">
          <span className="text-emerald-600 mr-1.5">[공지]</span>
          {notice.title}
        </p>
      </div>
    </Link>
  )
}