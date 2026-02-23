"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Send, CheckCircle, MessageSquare, Loader2 } from "lucide-react"
import Link from "next/link"
import type { InquiryCategory, InquiryMessage } from "@/types"
import { useUser } from "@/context/user-context"

// =============================================================================
// 📬 /mypage/inquiry — 문의하기 페이지
//
// 작동 방식:
// 1. 유저가 카테고리, 제목, 내용을 작성하고 전송
// 2. POST /api/inquiry → Supabase inquiries 테이블에 저장
// 3. 내 문의 내역 탭 → GET /api/inquiry → 실제 DB 데이터 표시
// =============================================================================

const CATEGORIES: { key: InquiryCategory; label: string; emoji: string }[] = [
  { key: "bug",     label: "버그/오류 신고", emoji: "🐛" },
  { key: "feature", label: "기능 제안",      emoji: "💡" },
  { key: "account", label: "계정 문의",      emoji: "🔐" },
  { key: "data",    label: "데이터 오류",    emoji: "📊" },
  { key: "other",   label: "기타",           emoji: "📝" },
]

const STATUS_CONFIG = {
  pending:   { label: "접수됨",   color: "bg-slate-100 text-slate-600" },
  in_review: { label: "검토중",   color: "bg-amber-50 text-amber-600"  },
  resolved:  { label: "답변완료", color: "bg-emerald-50 text-emerald-600" },
}

export default function InquiryPage() {
  const { profile } = useUser()
  const [tab, setTab] = useState<"write" | "history">("write")
  const [category, setCategory] = useState<InquiryCategory>("feature")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [inquiries, setInquiries] = useState<InquiryMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // 내 문의 탭으로 전환 시 데이터 로드
  useEffect(() => {
    if (tab !== "history") return
    const load = async () => {
      setIsLoadingHistory(true)
      setHistoryError(null)
      try {
        const res = await fetch("/api/inquiry")
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setInquiries(data.inquiries ?? [])
      } catch (e: any) {
        setHistoryError(e.message ?? "문의 목록을 불러오지 못했습니다.")
      } finally {
        setIsLoadingHistory(false)
      }
    }
    load()
  }, [tab])

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setSubmitError("제목과 내용을 모두 입력해 주세요.")
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: title.trim(),
          body: body.trim(),
          userNickname: profile?.nickname,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setIsSubmitted(true)
      setTitle("")
      setBody("")
    } catch (e: any) {
      setSubmitError(e.message ?? "전송에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/mypage" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <span className="text-[16px] font-black text-slate-900">문의하기</span>
        </div>
        {/* 탭 */}
        <div className="max-w-md mx-auto px-5 pb-3 flex gap-2">
          {(["write", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-[11px] font-black transition-all ${
                tab === t ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-500"
              }`}>
              {t === "write" ? "✍️ 문의 작성" : `📋 내 문의 (${inquiries.length})`}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 py-5 space-y-4">

        {/* ── 탭: 문의 작성 ── */}
        {tab === "write" && (
          isSubmitted ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
              <p className="text-[18px] font-black text-slate-800">문의가 접수되었습니다</p>
              <p className="text-[13px] font-bold text-slate-400 mt-2 leading-relaxed">
                빠른 시간 내에 검토 후 답변 드리겠습니다.<br />
                내 문의 탭에서 진행 상황을 확인하실 수 있어요.
              </p>
              <button onClick={() => setIsSubmitted(false)}
                className="mt-8 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[13px] font-black active:scale-95 transition-all">
                새 문의 작성
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 카테고리 */}
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">문의 유형</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.key} onClick={() => setCategory(c.key)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-center transition-all ${
                        category === c.key
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                      }`}>
                      <span className="text-xl">{c.emoji}</span>
                      <span className={`text-[9px] font-black ${category === c.key ? "text-emerald-700" : "text-slate-500"}`}>
                        {c.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 + 내용 */}
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">제목</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="문의 제목을 간략히 적어주세요"
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[14px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">내용</label>
                    <span className={`text-[10px] font-bold ${body.length > 1800 ? "text-rose-400" : "text-slate-400"}`}>
                      {body.length}/2000
                    </span>
                  </div>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={6}
                    placeholder="문의 내용을 자세히 적어주세요. 스크린샷이 필요한 경우 이메일(support@dukgu.app)로 첨부 파일을 함께 보내주세요."
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[14px] font-bold text-slate-800 border border-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 resize-none leading-relaxed"
                  />
                </div>
                {submitError && <p className="text-[11px] font-bold text-rose-400">{submitError}</p>}
              </div>

              <button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !body.trim()}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[20px] text-[14px] font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> 전송 중...</>
                  : <><Send className="w-4 h-4" /> 문의 전송</>}
              </button>
            </div>
          )
        )}

        {/* ── 탭: 내 문의 내역 ── */}
        {tab === "history" && (
          isLoadingHistory ? (
            <div className="py-24 flex flex-col items-center text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm font-bold">문의 내역을 불러오는 중...</p>
            </div>
          ) : historyError ? (
            <div className="py-24 flex flex-col items-center text-rose-400">
              <p className="text-sm font-bold">{historyError}</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="py-24 flex flex-col items-center text-slate-300">
              <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-bold">아직 문의 내역이 없습니다</p>
            </div>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {CATEGORIES.find((c) => c.key === inq.category)?.label ?? inq.category}
                      </span>
                    </div>
                    <p className="text-[14px] font-black text-slate-800">{inq.title}</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full shrink-0 ${STATUS_CONFIG[inq.status].color}`}>
                    {STATUS_CONFIG[inq.status].label}
                  </span>
                </div>
                <p className="text-[12px] font-bold text-slate-500 leading-relaxed line-clamp-2">{inq.body}</p>
                {inq.reply && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                    <p className="text-[9px] font-black text-emerald-600 mb-1">운영자 답변</p>
                    <p className="text-[12px] font-bold text-emerald-800 leading-relaxed">{inq.reply}</p>
                  </div>
                )}
                <p className="text-[10px] font-bold text-slate-300">
                  {new Date(inq.submittedAt).toLocaleDateString("ko-KR")} 접수
                </p>
              </div>
            ))
          )
        )}

      </main>
    </div>
  )
}
