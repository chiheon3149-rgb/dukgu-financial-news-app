"use client"

import { useState, useEffect } from "react"
import { ThumbsUp, ThumbsDown, Send, Check, X, Flag } from "lucide-react"
import type { CommentReportReason } from "@/types"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

interface NewsComment {
  id: string
  author_id: string | null
  author_nickname: string
  author_emoji: string
  author_level: number
  content: string
  timeAgo: string
  like_count: number
  dislike_count: number
  report_count: number
  is_removed: boolean
  published_at: string
}

const REPORT_REASONS: { value: CommentReportReason; label: string }[] = [
  { value: "spam",           label: "스팸 / 도배" },
  { value: "hate",           label: "혐오 발언" },
  { value: "sexual",         label: "음란 / 성적 콘텐츠" },
  { value: "violence",       label: "폭력 / 위협" },
  { value: "misinformation", label: "허위 정보" },
  { value: "other",          label: "기타" },
]

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "방금 전"
  if (min < 60) return `${min}분 전`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d === 1) return "어제"
  return `${d}일 전`
}

interface ReportModalState {
  commentId: string
  reason: CommentReportReason | null
  detail: string
}

export function NewsCommentSection({ newsId, onCountChange }: { newsId: string; onCountChange?: (count: number) => void }) {
  const { profile } = useUser()
  const [comments, setComments] = useState<NewsComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inputText, setInputText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, "like" | "dislike">>({})
  const [reportModal, setReportModal] = useState<ReportModalState | null>(null)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())

  // 💡 [수정] 댓글 개수가 변할 때만 부모에게 알립니다. (useEffect 활용)
  // 이렇게 하면 렌더링 도중 setState를 호출하는 충돌이 발생하지 않습니다.
  useEffect(() => {
    if (!isLoading) {
      onCountChange?.(comments.length)
    }
  }, [comments.length, onCountChange, isLoading])

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from("news_comments")
        .select("id, author_id, author_nickname, author_emoji, author_level, content, like_count, dislike_count, report_count, is_removed, published_at")
        .eq("news_id", newsId)
        .order("published_at", { ascending: true })
      setComments((data ?? []).map(r => ({ ...r, timeAgo: formatTimeAgo(r.published_at) })))
      setIsLoading(false)
    }
    fetchComments()
  }, [newsId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    const { data } = await supabase
      .from("news_comments")
      .insert({
        news_id: newsId,
        author_id: profile?.id ?? null,
        author_nickname: profile?.nickname ?? "익명",
        author_emoji: profile?.avatarEmoji ?? "🐱",
        author_level: 1,
        content: inputText.trim(),
      })
      .select()
      .single()
    
    if (data) {
      // 💡 [수정] 부모 호출(onCountChange)을 여기서 제거했습니다. 위 useEffect가 알아서 처리합니다.
      setComments(prev => [...prev, { ...data, timeAgo: "방금 전" }])
      await supabase.rpc("increment_news_comment_count", { target_news_id: newsId })
    }
    setInputText("")
  }

  const saveEdit = async (id: string) => {
    await supabase.from("news_comments").update({ content: editText }).eq("id", id)
    setComments(prev => prev.map(c => c.id === id ? { ...c, content: editText } : c))
    setEditingId(null)
  }

  const deleteComment = async (id: string) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return
    await supabase.from("news_comments").delete().eq("id", id)
    
    // 💡 [수정] 여기서도 부모 호출 로직을 제거했습니다.
    setComments(prev => prev.filter(c => c.id !== id))
    await supabase.rpc("decrement_news_comment_count", { target_news_id: newsId })
    setOpenMenuId(null)
  }

  const handleReact = async (id: string, type: "like" | "dislike") => {
    const prev = reactions[id]
    if (prev === type) return
    const target = comments.find(c => c.id === id)
    if (!target) return
    const newLike = type === "like" ? target.like_count + 1 : prev === "like" ? target.like_count - 1 : target.like_count
    const newDislike = type === "dislike" ? target.dislike_count + 1 : prev === "dislike" ? target.dislike_count - 1 : target.dislike_count
    setReactions(r => ({ ...r, [id]: type }))
    setComments(cs => cs.map(c => c.id === id ? { ...c, like_count: newLike, dislike_count: newDislike } : c))
    await supabase.from("news_comments").update({ like_count: newLike, dislike_count: newDislike }).eq("id", id)
  }

  const handleReportSubmit = async () => {
    if (!reportModal?.reason) return
    setIsSubmittingReport(true)
    try {
      await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: reportModal.commentId,
          postId: `news-${newsId}`,
          reason: reportModal.reason,
          detail: reportModal.detail || undefined,
          reportedAt: new Date().toISOString(),
        }),
      })
      setComments(prev =>
        prev.map(c => c.id === reportModal.commentId
          ? { ...c, report_count: c.report_count + 1, is_removed: c.report_count + 1 >= 3 }
          : c
        )
      )
      setReportedIds(prev => new Set(prev).add(reportModal.commentId))
    } finally {
      setIsSubmittingReport(false)
      setReportModal(null)
    }
  }

  // UI 렌더링 부분은 동일하므로 생략 (기존 코드 그대로 유지)
  return (
    <section className="mt-8 border-t-8 border-slate-50 pt-6 -mx-5 px-5">
      <h4 className="text-sm font-black text-slate-900 mb-5">
        댓글 {comments.length}개
      </h4>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center text-base">
          {profile?.avatarEmoji ?? "🐱"}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="w-full bg-slate-50 border border-slate-100 rounded-full py-2.5 pl-4 pr-10 text-[13px] focus:outline-none focus:bg-white focus:border-emerald-200 transition-all"
          />
          <button type="submit" disabled={!inputText.trim()} className={`absolute right-3 top-2.5 transition-colors ${inputText.trim() ? "text-emerald-500" : "text-slate-300"}`}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="text-center text-slate-400 text-xs py-6 animate-pulse">댓글 불러오는 중...</div>
      )}
      {!isLoading && comments.length === 0 && (
        <div className="text-center text-slate-300 text-xs py-6">첫 댓글을 남겨보세요!</div>
      )}

      <div className="flex flex-col divide-y divide-slate-50">
        {comments.filter(c => !c.is_removed).map((comment) => {
          const myReaction = reactions[comment.id]
          const isMyComment = comment.author_id === profile?.id
          const alreadyReported = reportedIds.has(comment.id)

          return (
            <div key={comment.id} className="py-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-base shrink-0">
                  {comment.author_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-black text-slate-800">{comment.author_nickname}</span>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full">Lv.{comment.author_level}</span>
                      <span className="text-[10px] font-medium text-slate-400">{comment.timeAgo}</span>
                    </div>
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)} className="p-1 text-slate-300 hover:text-slate-500 transition-colors text-[14px] leading-none">···</button>
                      {openMenuId === comment.id && (
                        <div className="absolute right-0 top-7 bg-white border border-slate-100 shadow-xl rounded-2xl py-1.5 z-20 min-w-[100px] flex flex-col">
                          {isMyComment ? (
                            <>
                              <button onClick={() => { setEditingId(comment.id); setEditText(comment.content); setOpenMenuId(null) }} className="text-[11px] px-4 py-2 hover:bg-slate-50 font-bold text-slate-600 text-left">수정하기</button>
                              <button onClick={() => deleteComment(comment.id)} className="text-[11px] px-4 py-2 hover:bg-slate-50 font-bold text-rose-500 text-left">삭제하기</button>
                            </>
                          ) : (
                            <button onClick={() => { setOpenMenuId(null); if (!alreadyReported) setReportModal({ commentId: comment.id, reason: null, detail: "" }) }} disabled={alreadyReported} className="text-[11px] px-4 py-2 hover:bg-slate-50 font-bold text-rose-500 text-left flex items-center gap-1.5 disabled:opacity-40">
                              <Flag className="w-3 h-3" />{alreadyReported ? "신고완료" : "신고하기"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {editingId === comment.id ? (
                    <div className="mt-1">
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full bg-slate-50 border border-emerald-200 rounded-xl p-3 text-[13px] focus:outline-none resize-none min-h-[72px]" />
                      <div className="flex justify-end gap-2 mt-1.5">
                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-400 bg-slate-100"><X className="w-3 h-3" /> 취소</button>
                        <button onClick={() => saveEdit(comment.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-white bg-emerald-500"><Check className="w-3 h-3" /> 완료</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] text-slate-600 leading-relaxed mb-2.5 font-medium">{comment.content}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleReact(comment.id, "like")} className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all active:scale-95 text-[10px] font-bold ${myReaction === "like" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:bg-slate-50"}`}>
                      <ThumbsUp className={`w-3 h-3 ${myReaction === "like" ? "fill-emerald-500" : ""}`} /> {comment.like_count}
                    </button>
                    <button onClick={() => handleReact(comment.id, "dislike")} className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all active:scale-95 text-[10px] font-bold ${myReaction === "dislike" ? "bg-rose-50 text-rose-500" : "text-slate-400 hover:bg-slate-50"}`}>
                      <ThumbsDown className={`w-3 h-3 ${myReaction === "dislike" ? "fill-rose-500" : ""}`} /> {comment.dislike_count}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-5">
              <h3 className="text-[15px] font-black text-slate-900 mb-1">댓글 신고</h3>
              <p className="text-[11px] font-bold text-slate-400 mb-4">신고 사유를 선택해 주세요.</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {REPORT_REASONS.map((r) => (
                  <button key={r.value} onClick={() => setReportModal(prev => prev ? { ...prev, reason: r.value } : null)}
                    className={`py-2.5 px-3 rounded-2xl border text-[12px] font-bold text-left transition-all active:scale-95 ${reportModal.reason === r.value ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
              {reportModal.reason === "other" && (
                <textarea placeholder="구체적인 내용을 입력해 주세요 (선택)" value={reportModal.detail}
                  onChange={(e) => setReportModal(prev => prev ? { ...prev, detail: e.target.value } : null)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-[12px] focus:outline-none resize-none min-h-[72px] mb-4 font-medium" />
              )}
              <div className="flex gap-2">
                <button onClick={() => setReportModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[13px] font-black active:scale-95">취소</button>
                <button onClick={handleReportSubmit} disabled={!reportModal.reason || isSubmittingReport}
                  className="flex-[2] py-3 bg-rose-500 text-white rounded-2xl text-[13px] font-black active:scale-95 disabled:opacity-40">
                  {isSubmittingReport ? "처리 중..." : "신고하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}