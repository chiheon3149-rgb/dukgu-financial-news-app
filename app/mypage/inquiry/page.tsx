"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Send, CheckCircle, MessageSquare, Loader2, ShieldAlert, Trophy } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { InquiryCategory, InquiryMessage } from "@/types"
import { useUser } from "@/context/user-context"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 📬 /mypage/inquiry — 문의하기 페이지 (관리자 퀴즈 버튼 포함)
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

function mapRow(r: any): InquiryMessage & { userEmail?: string, userNickname?: string } {
  return {
    id: r.id,
    category: r.category as InquiryCategory,
    title: r.title,
    body: r.body,
    submittedAt: r.submitted_at,
    status: r.status ?? "pending",
    reply: r.reply ?? undefined,
    userEmail: r.user_email,
    userNickname: r.user_nickname,
  }
}

export default function InquiryPage() {
  const { profile } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
  const [tab, setTab] = useState<"write" | "history">("write")
  const [inquiries, setInquiries] = useState<(InquiryMessage & { userEmail?: string, userNickname?: string })[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!profile?.id) {
        setIsCheckingAdmin(false)
        return
      }
      try {
        const { data } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", profile.id)
          .single()
        if (data?.is_admin === true) setIsAdmin(true)
      } catch (error) {
        console.error("관리자 확인 실패:", error)
      } finally {
        setIsCheckingAdmin(false)
      }
    }
    checkAdminStatus()
  }, [profile?.id])

  const loadInquiries = async () => {
    setIsLoadingHistory(true)
    try {
      const endpoint = isAdmin ? "/api/admin/inquiry" : "/api/inquiry"
      const res = await fetch(endpoint, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInquiries(data.inquiries ? data.inquiries.map(mapRow) : [])
    } catch (e: any) {
      console.error(e)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (!isCheckingAdmin) loadInquiries()
  }, [isAdmin, isCheckingAdmin])

  const handleAdminReply = async (id: string) => {
    if (!replyText.trim()) return
    try {
      const res = await fetch("/api/admin/inquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reply: replyText.trim() }),
      })
      if (!res.ok) throw new Error("답변 전송 실패")
      toast.success("답변 등록 완료! 🚀")
      setReplyingId(null)
      setReplyText("")
      loadInquiries() 
    } catch (e) {
      toast.error("오류가 발생했습니다.")
    }
  }

  if (isCheckingAdmin) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className="min-h-dvh bg-slate-50 pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/mypage" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <span className="text-[16px] font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-500" /> 관리자 센터
            </span>
          </div>

          {/* 💡 [여기가 중요!] 링크가 /mypage/quiz/admin으로 정확히 걸려있는지 확인하세요! */}
          <Link 
            href="/mypage/quiz/admin" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black hover:bg-blue-100 border border-blue-100 transition-all"
          >
            <Trophy className="w-3.5 h-3.5" /> 퀴즈 관리
          </Link>
        </div>

        <main className="max-w-md mx-auto px-5 py-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-bold text-slate-500">총 {inquiries.length}건의 문의</p>
          </div>

          {isLoadingHistory ? (
            <div className="py-24 flex flex-col items-center text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
            </div>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {CATEGORIES.find((c) => c.key === inq.category)?.label ?? inq.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {inq.userNickname || "알 수 없음"}
                      </span>
                    </div>
                    <p className="text-[14px] font-black text-slate-800">{inq.title}</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full shrink-0 ${STATUS_CONFIG[inq.status as keyof typeof STATUS_CONFIG]?.color || "bg-slate-100"}`}>
                    {STATUS_CONFIG[inq.status as keyof typeof STATUS_CONFIG]?.label || "대기"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-[12px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {inq.body}
                </div>
                {inq.reply ? (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[12px] font-bold text-emerald-800">
                    {inq.reply}
                  </div>
                ) : (
                  <div className="mt-2">
                    {replyingId === inq.id ? (
                      <div className="space-y-2">
                        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} className="w-full p-3 text-[12px] border border-emerald-200 rounded-xl outline-none" placeholder="답변을 입력하세요..." />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setReplyingId(null)} className="px-3 py-1.5 text-[11px] font-bold text-slate-400">취소</button>
                          <button onClick={() => handleAdminReply(inq.id)} className="px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-500 rounded-xl">등록</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReplyingId(inq.id)} className="w-full py-2 bg-slate-50 text-[12px] font-bold text-emerald-600 rounded-xl">답변 작성하기</button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </main>
      </div>
    )
  }

  // 일반 유저용 화면
  return <InquiryUserView
    tab={tab}
    setTab={setTab}
    inquiries={inquiries}
    isLoadingHistory={isLoadingHistory}
    profile={profile}
    onRefresh={loadInquiries}
  />
}

// =============================================================================
// 일반 유저 전용 문의하기 뷰
// =============================================================================

function InquiryUserView({
  tab,
  setTab,
  inquiries,
  isLoadingHistory,
  profile,
  onRefresh,
}: {
  tab: "write" | "history"
  setTab: (t: "write" | "history") => void
  inquiries: (InquiryMessage & { userEmail?: string; userNickname?: string })[]
  isLoadingHistory: boolean
  profile: any
  onRefresh: () => void
}) {
  const [category, setCategory] = useState<InquiryCategory>("bug")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error("제목과 내용을 모두 입력해주세요.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: title.trim(),
          body: body.trim(),
          userNickname: profile?.nickname ?? "익명",
          userEmail: profile?.email ?? "",
        }),
      })
      if (!res.ok) throw new Error("전송 실패")
      setSubmitted(true)
      toast.success("문의가 접수되었다냥! 🐾")
      setTitle("")
      setBody("")
      setCategory("bug")
      onRefresh()
    } catch {
      toast.error("전송 중 오류가 발생했습니다.")
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
          <span className="text-[16px] font-black text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" /> 문의하기
          </span>
        </div>

        {/* 탭 */}
        <div className="max-w-md mx-auto px-5 pb-3 flex gap-2">
          {(["write", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-[12px] font-black transition-all ${
                tab === t
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {t === "write" ? "문의 작성" : `내 문의 (${inquiries.length})`}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 py-5">
        {/* 작성 탭 */}
        {tab === "write" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {submitted && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-[20px] p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-[13px] font-bold text-emerald-700">문의가 접수되었습니다. 답변은 내 문의 탭에서 확인하세요.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 카테고리 */}
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-3">
                <p className="text-[13px] font-black text-slate-700">문의 유형</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-black transition-all border ${
                        category === cat.key
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-slate-50 text-slate-500 border-slate-100 hover:border-emerald-200"
                      }`}
                    >
                      <span>{cat.emoji}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-2">
                <p className="text-[13px] font-black text-slate-700">제목</p>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="문의 제목을 입력해주세요"
                  className="w-full text-[13px] font-medium text-slate-800 placeholder:text-slate-300 outline-none bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus:border-emerald-300 transition-colors"
                  maxLength={100}
                />
              </div>

              {/* 내용 */}
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-2">
                <p className="text-[13px] font-black text-slate-700">내용</p>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="문의 내용을 자세히 적어주세요"
                  rows={6}
                  className="w-full text-[13px] font-medium text-slate-800 placeholder:text-slate-300 outline-none bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus:border-emerald-300 transition-colors resize-none leading-relaxed"
                  maxLength={2000}
                />
                <p className="text-right text-[11px] font-bold text-slate-300">{body.length} / 2000</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 text-white rounded-[20px] text-[14px] font-black shadow-sm shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                문의 보내기
              </button>
            </form>
          </div>
        )}

        {/* 내 문의 탭 */}
        {tab === "history" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {isLoadingHistory ? (
              <div className="py-24 flex flex-col items-center text-slate-300">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
              </div>
            ) : inquiries.length === 0 ? (
              <div className="py-24 flex flex-col items-center text-slate-300">
                <MessageSquare className="w-10 h-10 opacity-20 mb-3" />
                <p className="text-[13px] font-bold">아직 문의 내역이 없습니다</p>
              </div>
            ) : (
              inquiries.map((inq) => (
                <div key={inq.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {CATEGORIES.find((c) => c.key === inq.category)?.label ?? inq.category}
                      </span>
                      <p className="text-[14px] font-black text-slate-800">{inq.title}</p>
                      <p className="text-[11px] font-bold text-slate-400">
                        {new Date(inq.submittedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full shrink-0 ${STATUS_CONFIG[inq.status as keyof typeof STATUS_CONFIG]?.color ?? "bg-slate-100"}`}>
                      {STATUS_CONFIG[inq.status as keyof typeof STATUS_CONFIG]?.label ?? "대기"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-[12px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {inq.body}
                  </div>
                  {inq.reply && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                      <p className="text-[10px] font-black text-emerald-600">덕구팀 답변</p>
                      <p className="text-[12px] font-medium text-emerald-800 leading-relaxed">{inq.reply}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}