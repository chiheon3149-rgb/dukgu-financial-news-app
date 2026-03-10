"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, BarChart2, ShieldCheck, Loader2, Plus, CalendarDays, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

interface VoteQuestion {
  id: string
  question: string
  active_date: string
  o_count: number
  x_count: number
  created_at: string
}

export default function VoteAdminPage() {
  const router = useRouter()
  const { profile, isLoading: isUserLoading } = useUser()

  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [tab, setTab] = useState<"register" | "history">("register")

  // 등록 폼
  const [question, setQuestion] = useState("")
  const [activeDate, setActiveDate] = useState(() => new Date().toISOString().split("T")[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 이력
  const [voteList, setVoteList] = useState<VoteQuestion[]>([])
  const [isLoadingList, setIsLoadingList] = useState(false)

  useEffect(() => {
    const verify = async () => {
      if (isUserLoading) return
      if (!profile?.id) { setIsChecking(false); return }
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", profile.id).single()
      if (data?.is_admin) setIsAdmin(true)
      setIsChecking(false)
    }
    verify()
  }, [profile?.id, isUserLoading])

  const loadVoteList = async () => {
    setIsLoadingList(true)
    const { data } = await supabase
      .from("vote_questions")
      .select("*")
      .order("active_date", { ascending: false })
    if (data) setVoteList(data as VoteQuestion[])
    setIsLoadingList(false)
  }

  useEffect(() => {
    if (isAdmin) loadVoteList()
  }, [isAdmin])

  const handleRegister = async () => {
    if (!question.trim()) { toast.error("질문을 입력해주세요."); return }
    if (!activeDate) { toast.error("날짜를 선택해주세요."); return }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), active_date: activeDate }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "등록 중 오류가 발생했습니다.")
        return
      }
      toast.success("투표가 등록되었습니다! 🗳️")
      setQuestion("")
      setActiveDate(new Date().toISOString().split("T")[0])
      loadVoteList()
      setTab("history")
    } catch {
      toast.error("등록 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("이 투표를 삭제하시겠습니까?")) return
    const res = await fetch("/api/admin/vote", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { toast.error("삭제 실패"); return }
    toast.success("삭제되었습니다.")
    setVoteList(prev => prev.filter(v => v.id !== id))
  }

  if (isChecking || isUserLoading) return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  )

  if (!isAdmin) return <div className="p-10 text-center font-black">접근 권한이 없습니다. 👮‍♂️</div>

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 font-sans">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-slate-100 z-10 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-[16px] font-black text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-500" /> 투표 관리
        </span>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-slate-100 px-5 pt-2 pb-3 flex gap-2">
        {(["register", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-[12px] font-black transition-all ${
              tab === t
                ? "bg-purple-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {t === "register" ? "투표 등록" : `투표 이력 (${voteList.length})`}
          </button>
        ))}
      </div>

      <main className="max-w-md mx-auto px-5 py-6 space-y-5">

        {/* 등록 탭 */}
        {tab === "register" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-4">
              <p className="text-[13px] font-black text-slate-700 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-400" /> 표시 날짜
              </p>
              <input
                type="date"
                value={activeDate}
                onChange={(e) => setActiveDate(e.target.value)}
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 outline-none border border-slate-100 focus:border-purple-300 transition-colors"
              />
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-3">
              <p className="text-[13px] font-black text-slate-700">투표 질문</p>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="예: 오늘 밤 비트코인 1억 재돌파 한다?"
                rows={3}
                maxLength={200}
                className="w-full bg-slate-50 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-700 placeholder:text-slate-300 outline-none border border-slate-100 focus:border-purple-300 transition-colors resize-none"
              />
              <p className="text-right text-[11px] font-bold text-slate-300">{question.length} / 200</p>
            </div>

            <button
              onClick={handleRegister}
              disabled={isSubmitting}
              className="w-full py-4 bg-purple-500 text-white rounded-[20px] text-[14px] font-black shadow-sm shadow-purple-100 hover:bg-purple-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              투표 등록하기
            </button>
          </div>
        )}

        {/* 이력 탭 */}
        {tab === "history" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {isLoadingList ? (
              <div className="py-24 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : voteList.length === 0 ? (
              <div className="py-24 flex flex-col items-center text-slate-300">
                <BarChart2 className="w-10 h-10 opacity-20 mb-3" />
                <p className="text-[13px] font-bold">등록된 투표가 없습니다</p>
              </div>
            ) : (
              voteList.map((v) => {
                const total = v.o_count + v.x_count
                const oPercent = total === 0 ? 50 : Math.round((v.o_count / total) * 100)
                const xPercent = 100 - oPercent
                const isToday = v.active_date === today
                const isPast = v.active_date < today

                return (
                  <div key={v.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-3">
                    {/* 날짜 + 상태 뱃지 */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">
                        {new Date(v.active_date + "T00:00:00").toLocaleDateString("ko-KR", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          isToday
                            ? "bg-emerald-100 text-emerald-600"
                            : isPast
                            ? "bg-slate-100 text-slate-400"
                            : "bg-blue-50 text-blue-500"
                        }`}>
                          {isToday ? "오늘" : isPast ? "종료" : "예정"}
                        </span>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="text-[10px] font-black text-rose-400 hover:text-rose-600 transition-colors px-2 py-0.5 rounded-lg hover:bg-rose-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* 질문 */}
                    <p className="text-[14px] font-bold text-slate-800 leading-snug">{v.question}</p>

                    {/* 결과 바 */}
                    {total > 0 ? (
                      <div className="space-y-2">
                        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-slate-100">
                          <div className="bg-rose-400 rounded-full transition-all" style={{ width: `${oPercent}%` }} />
                          <div className="bg-sky-400 rounded-full flex-1" />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-rose-500">🔥 돌파 {oPercent}% ({v.o_count.toLocaleString()}명)</span>
                          <span className="text-sky-500">🧊 안 함 {xPercent}% ({v.x_count.toLocaleString()}명)</span>
                        </div>
                        <p className="text-center text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1">
                          <TrendingUp className="w-3 h-3" /> 총 {total.toLocaleString()}명 참여
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] font-bold text-slate-300 text-center">아직 참여자 없음</p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
