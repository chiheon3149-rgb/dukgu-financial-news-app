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

  const href = notice.link_url ?? `/notice/${notice.id}`

  return (
    <Link href={href} className="block">
      <div className="bg-blue-50/60 border border-blue-100/80 rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition-all hover:bg-blue-50 cursor-pointer">
        <Bell className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
        <p className="text-[13px] font-bold text-blue-900 leading-snug tracking-tight">
          {notice.title}
        </p>
      </div>
    </Link>
  )
}
