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

  // 💡 [수정] 외부 링크가 있으면 외부로, 없으면 '무조건 공지사항 리스트'로 이동!
  const href = notice.link_url ?? "/notice"

  return (
    <Link href={href} className="block">
      {/* 🍃 블루에서 민트(Emerald) 계열로 변경하여 전체 톤앤매너를 맞췄습니다. */}
      <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition-all hover:bg-emerald-100/50 cursor-pointer active:scale-[0.98]">
        {/* 아이콘도 민트색으로! animate-pulse는 유지하여 주목도를 높였습니다. */}
        <Bell className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
        <p className="text-[13px] font-bold text-emerald-900 leading-snug tracking-tight truncate flex-1">
          {/* 💡 [센스 추가] 제목 앞에 [공지] 태그를 살짝 붙여주면 더 명확해집니다 */}
          <span className="text-emerald-600 mr-1.5">[공지]</span>
          {notice.title}
        </p>
      </div>
    </Link>
  )
}