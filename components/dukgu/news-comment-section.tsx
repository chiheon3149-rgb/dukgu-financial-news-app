"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, Send, Check, X, Flag, AlertTriangle } from "lucide-react"
import type { CommentReportReason } from "@/types"

// =============================================================================
// 💬 NewsCommentSection
//
// 뉴스 상세 페이지 전용 댓글 컴포넌트입니다.
// 커뮤니티 CommentSection과 UI는 동일하지만 뉴스 ID 기반으로 동작하며,
// 초기 댓글 데이터는 뉴스 ID에 맞춰 내부에서 세팅합니다.
//
// 신고 기능 포함:
//   - 사유 선택 모달 → POST /api/community/report 전송
//   - 신고 3회 누적 시 "신고에 의해 삭제된 댓글입니다." 표시
// =============================================================================

interface NewsComment {
  id: string
  authorNickname: string
  authorEmoji: string
  authorLevel: number
  content: string
  timeAgo: string
  likeCount: number
  dislikeCount: number
  reportCount: number
  isRemovedByAdmin: boolean
}

const REPORT_REASONS: { value: CommentReportReason; label: string }[] = [
  { value: "spam",           label: "스팸 / 도배" },
  { value: "hate",           label: "혐오 발언" },
  { value: "sexual",         label: "음란 / 성적 콘텐츠" },
  { value: "violence",       label: "폭력 / 위협" },
  { value: "misinformation", label: "허위 정보" },
  { value: "other",          label: "기타" },
]

// Mock 초기 댓글 데이터
const INITIAL_NEWS_COMMENTS: NewsComment[] = [
  { id: "nc-001", authorNickname: "치즈집사",   authorEmoji: "🐱", authorLevel: 2, content: "덕구 요약 최고다냥! 꾹꾹이 해주고 싶다냥.", timeAgo: "3분 전",  likeCount: 5,  dislikeCount: 0, reportCount: 0, isRemovedByAdmin: false },
  { id: "nc-002", authorNickname: "고등어대장", authorEmoji: "🐟", authorLevel: 1, content: "금리 동결이라 대출 이자는 그대로겠네요...", timeAgo: "12분 전", likeCount: 2,  dislikeCount: 1, reportCount: 0, isRemovedByAdmin: false },
]

const MY_USER = { id: "user-001", nickname: "나", emoji: "🐶", level: 2 }

interface ReportModalState {
  commentId: string
  reason: CommentReportReason | null
  detail: string
}

export function NewsCommentSection({ newsId }: { newsId: string }) {
  const [comments, setComments] = useState<NewsComment[]>(INITIAL_NEWS_COMMENTS)
  const [inputText, setInputText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, "like" | "dislike">>({})
  const [reportModal, setReportModal] = useState<ReportModalState | null>(null)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    const newComment: NewsComment = {
      id: `nc-${Date.now()}`,
      authorNickname: MY_USER.nickname,
      authorEmoji: MY_USER.emoji,
      authorLevel: MY_USER.level,
      content: inputText.trim(),
      timeAgo: "방금 전",
      likeCount: 0,
      dislikeCount: 0,
      reportCount: 0,
      isRemovedByAdmin: false,
    }
    setComments((prev) => [...prev, newComment])
    setInputText("")
  }

  const saveEdit = (id: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, content: editText } : c))
    setEditingId(null)
  }

  const deleteComment = (id: string) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return
    setComments((prev) => prev.filter((c) => c.id !== id))
    setOpenMenuId(null)
  }

  const handleReact = (id: string, type: "like" | "dislike") => {
    const prev = reactions[id]
    if (prev === type) return
    setReactions((r) => ({ ...r, [id]: type }))
    setComments((cs) =>
      cs.map((c) => c.id === id ? {
        ...c,
        likeCount: type === "like" ? c.likeCount + 1 : prev === "like" ? c.likeCount - 1 : c.likeCount,
        dislikeCount: type === "dislike" ? c.dislikeCount + 1 : prev === "dislike" ? c.dislikeCount - 1 : c.dislikeCount,
      } : c)
    )
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
      // 신고 횟수 증가 + 3회 이상이면 블라인드
      setComments((prev) =>
        prev.map((c) => c.id === reportModal.commentId
          ? { ...c, reportCount: c.reportCount + 1, isRemovedByAdmin: c.reportCount + 1 >= 3 }
          : c
        )
      )
      setReportedIds((prev) => new Set(prev).add(reportModal.commentId))
    } finally {
      setIsSubmittingReport(false)
      setReportModal(null)
    }
  }

  return (
    <section className="mt-8 border-t-8 border-slate-50 pt-6 -mx-5 px-5">
      <h4 className="text-sm font-black text-slate-900 mb-5">
        댓글 {comments.length}개
      </h4>

      {/* 입력창 */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center text-base">
          {MY_USER.emoji}
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

      {/* 댓글 목록 */}
      <div className="flex flex-col divide-y divide-slate-50">
        {comments.map((comment) => {
          if (comment.isRemovedByAdmin) {
            return (
              <div key={comment.id} className="py-4 flex items-center gap-2 text-slate-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <p className="text-[12px] font-medium">신고에 의해 삭제된 댓글입니다.</p>
              </div>
            )
          }

          const myReaction = reactions[comment.id]
          const isMyComment = comment.authorNickname === MY_USER.nickname
          const alreadyReported = reportedIds.has(comment.id)

          return (
            <div key={comment.id} className="py-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-base shrink-0">
                  {comment.authorEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-black text-slate-800">{comment.authorNickname}</span>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full">Lv.{comment.authorLevel}</span>
                      <span className="text-[10px] font-medium text-slate-400">{comment.timeAgo}</span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                        className="p-1 text-slate-300 hover:text-slate-500 transition-colors text-[14px] leading-none"
                      >···</button>
                      {openMenuId === comment.id && (
                        <div className="absolute right-0 top-7 bg-white border border-slate-100 shadow-xl rounded-2xl py-1.5 z-20 min-w-[100px] flex flex-col">
                          {isMyComment ? (
                            <>
                              <button onClick={() => { setEditingId(comment.id); setEditText(comment.content); setOpenMenuId(null) }} className="text-[11px] px-4 py-2 hover:bg-slate-50 font-bold text-slate-600 text-left">수정하기</button>
                              <button onClick={() => deleteComment(comment.id)} className="text-[11px] px-4 py-2 hover:bg-slate-50 font-bold text-rose-500 text-left">삭제하기</button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setOpenMenuId(null); if (!alreadyReported) setReportModal({ commentId: comment.id, reason: null, detail: "" }) }}
                              disabled={alreadyReported}
                              className="text-[11px] px-4 py-2 hover:bg-slate-50 font-bold text-rose-500 text-left flex items-center gap-1.5 disabled:opacity-40"
                            >
                              <Flag className="w-3 h-3" />
                              {alreadyReported ? "신고완료" : "신고하기"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 본문 or 수정창 */}
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

                  {/* 반응 */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleReact(comment.id, "like")} className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all active:scale-95 text-[10px] font-bold ${myReaction === "like" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:bg-slate-50"}`}>
                      <ThumbsUp className={`w-3 h-3 ${myReaction === "like" ? "fill-emerald-500" : ""}`} /> {comment.likeCount}
                    </button>
                    <button onClick={() => handleReact(comment.id, "dislike")} className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all active:scale-95 text-[10px] font-bold ${myReaction === "dislike" ? "bg-rose-50 text-rose-500" : "text-slate-400 hover:bg-slate-50"}`}>
                      <ThumbsDown className={`w-3 h-3 ${myReaction === "dislike" ? "fill-rose-500" : ""}`} /> {comment.dislikeCount}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 신고 모달 */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-5">
              <h3 className="text-[15px] font-black text-slate-900 mb-1">댓글 신고</h3>
              <p className="text-[11px] font-bold text-slate-400 mb-4">신고 사유를 선택해 주세요.</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {REPORT_REASONS.map((r) => (
                  <button key={r.value} onClick={() => setReportModal((prev) => prev ? { ...prev, reason: r.value } : null)}
                    className={`py-2.5 px-3 rounded-2xl border text-[12px] font-bold text-left transition-all active:scale-95 ${reportModal.reason === r.value ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
              {reportModal.reason === "other" && (
                <textarea placeholder="구체적인 내용을 입력해 주세요 (선택)" value={reportModal.detail}
                  onChange={(e) => setReportModal((prev) => prev ? { ...prev, detail: e.target.value } : null)}
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
