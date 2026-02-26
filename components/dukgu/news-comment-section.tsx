"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThumbsUp, ThumbsDown, Check, X, Flag } from "lucide-react"
import { toast } from "sonner"
import type { CommentReportReason } from "@/types"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"
import { CommentInput } from "@/components/dukgu/comment-input" // 💡 새로 만든 부품 임포트

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

export function NewsCommentSection({ 
  newsId, 
  onCountChange 
}: { 
  newsId: string; 
  onCountChange?: (count: number) => void 
}) {
  const { profile } = useUser()
  const router = useRouter()
  const [comments, setComments] = useState<NewsComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inputText, setInputText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, "like" | "dislike">>(() => {
    if (typeof window === "undefined") return {}
    try {
      return JSON.parse(localStorage.getItem(`dukgu:news_comment_reactions:${newsId}`) ?? "{}")
    } catch { return {} }
  })
  const [reportModal, setReportModal] = useState<ReportModalState | null>(null)
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isLoading) {
      onCountChange?.(comments.length)
    }
  }, [comments.length, onCountChange, isLoading])

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from("news_comments")
        .select("*")
        .eq("news_id", newsId)
        .order("published_at", { ascending: true })
      
      const rows = data ?? []
      setComments(rows.map(r => ({ ...r, timeAgo: formatTimeAgo(r.published_at) })))
      setIsLoading(false)
    }
    fetchComments()
  }, [newsId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    // 💡 통일된 로그인 팝업 (강제 이동 X)
    if (!profile) {
      toast("로그인이 필요한 기능이다냥! 🐾", {
        description: "댓글을 작성하려면 덕구네 식구가 되어 달라냥.",
        action: {
          label: "로그인하기",
          onClick: () => router.push("/login"),
        },
      })
      return
    }

    const { data } = await supabase
      .from("news_comments")
      .insert({
        news_id: newsId,
        author_id: profile.id,
        author_nickname: profile.nickname,
        author_emoji: profile.avatarEmoji,
        author_level: 1,
        content: inputText.trim(),
      })
      .select().single()
    
    if (data) {
      setComments(prev => [...prev, { ...data, timeAgo: "방금 전" }])
      await supabase.rpc("increment_news_comment_count", { target_news_id: newsId })
    }
    setInputText("")
  }

  const handleReact = async (id: string, type: "like" | "dislike") => {
    if (!profile) {
      toast("로그인이 필요한 기능이다냥! 🐾", {
        description: "좋아요를 누르려면 덕구네 식구가 되어 달라냥.",
        action: { label: "로그인하기", onClick: () => router.push("/login") },
      })
      return
    }

    const prev = reactions[id]
    if (prev === type) return
    const target = comments.find(c => c.id === id)
    if (!target) return
    
    const newLike = type === "like" ? target.like_count + 1 : (prev === "like" ? Math.max(0, target.like_count - 1) : target.like_count)
    const newDislike = type === "dislike" ? target.dislike_count + 1 : (prev === "dislike" ? Math.max(0, target.dislike_count - 1) : target.dislike_count)
    
    const newReactions = { ...reactions, [id]: type }
    setReactions(newReactions)
    localStorage.setItem(`dukgu:news_comment_reactions:${newsId}`, JSON.stringify(newReactions))
    setComments(cs => cs.map(c => c.id === id ? { ...c, like_count: newLike, dislike_count: newDislike } : c))
    await supabase.from("news_comments").update({ like_count: newLike, dislike_count: newDislike }).eq("id", id)
  }

  const saveEdit = async (id: string) => {
    await supabase.from("news_comments").update({ content: editText }).eq("id", id)
    setComments(prev => prev.map(c => c.id === id ? { ...c, content: editText } : c))
    setEditingId(null)
  }

  const deleteComment = (id: string) => {
    toast("댓글을 삭제하시겠습니까?", {
      action: { 
        label: "삭제", 
        onClick: async () => {
          await supabase.from("news_comments").delete().eq("id", id)
          setComments(prev => prev.filter(c => c.id !== id))
          await supabase.rpc("decrement_news_comment_count", { target_news_id: newsId })
          setOpenMenuId(null)
        } 
      },
      cancel: { label: "취소", onClick: () => {} },
    })
  }

  return (
    <section className="mt-8 border-t-8 border-slate-50 pt-6 -mx-5 px-5">
      <h4 className="text-sm font-black text-slate-900 mb-5 tabular-nums">
        댓글 {comments.length}개
      </h4>

      {/* 💡 [수정] 공용 부품 사용! 버튼이 정중앙에 오고 잘 눌립니다. */}
      <CommentInput
        value={inputText}
        onChange={setInputText}
        onSubmit={handleSubmit}
        userEmoji={profile?.avatarEmoji}
        placeholder="댓글을 입력하세요"
      />

      {isLoading && <div className="text-center text-slate-400 text-xs py-6 animate-pulse">댓글 불러오는 중...</div>}
      {!isLoading && comments.length === 0 && <div className="text-center text-slate-300 text-xs py-6">첫 댓글을 남겨보세요!</div>}

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
                      <span className="text-[10px] font-medium text-slate-400 tabular-nums">{comment.timeAgo}</span>
                    </div>
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)} className="p-1 text-slate-300 hover:text-slate-500 transition-colors font-bold">···</button>
                      {openMenuId === comment.id && (
                        <div className="absolute right-0 top-7 bg-white border border-slate-100 shadow-xl rounded-2xl py-1.5 z-20 min-w-[100px] flex flex-col">
                          {isMyComment ? (
                            <>
                              <button onClick={() => { setEditingId(comment.id); setEditText(comment.content); setOpenMenuId(null) }} className="text-[11px] px-4 py-2 hover:bg-slate-50 font-bold text-slate-600 text-left">수정하기</button>
                              <button onClick={() => deleteComment(comment.id)} className="text-[11px] px-4 py-2 hover:bg-slate-50 font-bold text-rose-500 text-left">삭제하기</button>
                            </>
                          ) : (
                            <button 
                              onClick={() => { 
                                setOpenMenuId(null); 
                                if (!profile) {
                                  toast("로그인이 필요한 기능이다냥! 🐾", {
                                    description: "신고하려면 덕구네 식구가 되어 달라냥.",
                                    action: { label: "로그인하기", onClick: () => router.push("/login") },
                                  })
                                  return
                                }
                                if (!alreadyReported) setReportModal({ commentId: comment.id, reason: null, detail: "" }) 
                              }} 
                              disabled={alreadyReported} 
                              className="text-[11px] px-4 py-2 hover:bg-slate-50 font-bold text-rose-500 text-left flex items-center gap-1.5"
                            >
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
                    <p className="text-[13px] text-slate-600 leading-relaxed mb-2.5 font-medium break-keep">{comment.content}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleReact(comment.id, "like")} className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all active:scale-95 text-[10px] font-bold ${myReaction === "like" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:bg-slate-50"}`}>
                      <ThumbsUp className={`w-3 h-3 ${myReaction === "like" ? "fill-emerald-500" : ""}`} /> <span className="tabular-nums">{comment.like_count}</span>
                    </button>
                    <button onClick={() => handleReact(comment.id, "dislike")} className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all active:scale-95 text-[10px] font-bold ${myReaction === "dislike" ? "bg-rose-50 text-rose-500" : "text-slate-400 hover:bg-slate-50"}`}>
                      <ThumbsDown className={`w-3 h-3 ${myReaction === "dislike" ? "fill-rose-500" : ""}`} /> <span className="tabular-nums">{comment.dislike_count}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}