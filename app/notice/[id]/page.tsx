"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Home } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { supabase } from "@/lib/supabase"

interface NoticeDetail {
  id: string
  notice_no: number // 💡 추가된 숫자 번호
  title: string
  category: string | null
  content: string
  details: {
    time?: string
    task?: string
    impact?: string
  } | null
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // params에서 id(숫자 또는 UUID)를 비동기로 가져옵니다.
  const { id } = use(params)
  
  const [notice, setNotice] = useState<NoticeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const { data, error } = await supabase
          .from("notices")
          .select("id, notice_no, title, category, content, details, created_at")
          .eq("notice_no", id) // 💡 UUID 대신 숫자 번호(notice_no)로 데이터를 찾습니다!
          .single()

        if (error) throw error
        if (data) setNotice(data as NoticeDetail)
      } catch (error) {
        console.error("공지사항 불러오기 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotice()
  }, [id])

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white text-slate-400 text-sm animate-pulse">
        공지사항을 불러오는 중...
      </div>
    )
  }

  // 데이터 없음 화면
  if (!notice) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-white gap-4">
        <p className="text-sm text-slate-500">존재하지 않는 공지사항입니다.</p>
        <Link href="/" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white pb-20">
      
      <DetailHeader 
        title="공지사항 상세" 
        rightElement={
          <Link href="/" className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <Home className="w-5 h-5 text-slate-800" />
          </Link>
        }
      />

      <main className="p-5">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            {/* 카테고리 뱃지 */}
            {notice.category && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">
                {notice.category}
              </span>
            )}
            <p className="text-xs text-slate-400 font-medium">{formatDate(notice.created_at)}</p>
          </div>
          <h2 className="text-lg font-bold text-slate-800 leading-snug">
            {notice.title}
          </h2>
        </div>

        {/* 텍스트 내용 */}
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          
          <div className="whitespace-pre-wrap">{notice.content}</div>
          
          {/* 상세 정보 박스 (JSON 데이터가 있을 때만) */}
          {notice.details && Object.keys(notice.details).length > 0 && (
            <div className="bg-slate-50 p-4 rounded-lg text-xs border border-slate-100 mt-6">
              <ul className="space-y-2 font-medium">
                {notice.details.time && (
                  <li><span className="text-slate-500 w-12 inline-block">작업 일시</span>: {notice.details.time}</li>
                )}
                {notice.details.task && (
                  <li><span className="text-slate-500 w-12 inline-block">작업 내용</span>: {notice.details.task}</li>
                )}
                {notice.details.impact && (
                  <li><span className="text-slate-500 w-12 inline-block">영향 범위</span>: {notice.details.impact}</li>
                )}
              </ul>
            </div>
          )}
          
        </div>
      </main>

    </div>
  )
}