"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, MoreVertical, Send, Check, X } from "lucide-react"

export function CommentSection({ count }: { count: number }) {
  const [commentText, setCommentText] = useState("")
  
  // 1. 데이터 상태 관리
  const [comments, setComments] = useState([
    { id: 1, nickname: "치즈집사", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", content: "덕구 요약 최고다냥! 꾹꾹이 해주고 싶다냥.", timeAgo: "3분 전", good: 5, bad: 0 },
    { id: 2, nickname: "고등어대장", profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kitty", content: "금리 소식 고맙다냥. 츄르 사러 가야겠다냥.", timeAgo: "12분 전", good: 2, bad: 1 },
  ])

  // 2. UI 제어 상태
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")

  // --- 기능 함수들 ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    const newComment = {
      id: Date.now(),
      nickname: "나(기획자)",
      profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky",
      content: commentText,
      timeAgo: "방금 전",
      good: 0,
      bad: 0
    }
    setComments([newComment, ...comments])
    setCommentText("")
  }

  const startEdit = (id: number, text: string) => {
    setEditingId(id)
    setEditText(text)
    setOpenMenuId(null)
  }

  const saveEdit = (id: number) => {
    setComments(comments.map(c => c.id === id ? { ...c, content: editText } : c))
    setEditingId(null)
    alert("수정이 완료되었다냥! 🐾")
  }

  const deleteComment = (id: number) => {
    if (window.confirm("정말로 이 댓글을 삭제하시겠냥? 😿")) {
      setComments(comments.filter(c => c.id !== id))
    }
    setOpenMenuId(null)
  }

  const handleReaction = (id: number, type: 'good' | 'bad') => {
    setComments(comments.map(c => {
      if (c.id === id) {
        return { ...c, good: type === 'good' ? c.good + 1 : c.good, bad: type === 'bad' ? c.bad + 1 : c.bad }
      }
      return c
    }))
  }

  return (
    <section className="mt-8 border-t-8 border-slate-50 pt-8 -mx-5 px-5">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-black text-slate-900">댓글 {comments.length}개</h4>
      </div>
      
      {/* 댓글 입력창 */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-8">
         <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0 border border-slate-200" />
         <div className="flex-1 relative">
           <input 
            type="text" 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="덕구에게 댓글을 남겨보라냥!" 
            className="w-full bg-slate-50 border border-slate-100 rounded-full py-2.5 pl-4 pr-10 text-[13px] focus:outline-none focus:bg-white transition-all"
           />
           <button type="submit" className={`absolute right-3 top-2.5 ${commentText ? 'text-blue-500' : 'text-slate-300'}`}>
             <Send className="w-4 h-4" />
           </button>
         </div>
      </form>
      
      {/* 댓글 리스트 */}
      <div className="flex flex-col">
        {comments.map((item) => (
          <div key={item.id} className="flex gap-3 py-4 border-b border-slate-50 last:border-0 relative">
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200/50">
              <img src={item.profileImage} alt={item.nickname} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-slate-800">{item.nickname}</span>
                  <span className="text-[10px] font-medium text-slate-400">{item.timeAgo}</span>
                </div>

                <div className="relative">
                  <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} className="p-1 text-slate-300 hover:text-slate-500">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  {openMenuId === item.id && (
                    <div className="absolute right-0 top-7 bg-white border border-slate-100 shadow-xl rounded-xl py-1 z-20 min-w-[80px] flex flex-col">
                      <button onClick={() => startEdit(item.id, item.content)} className="text-[11px] py-2 hover:bg-slate-50 font-bold text-slate-600 border-b border-slate-50">수정하기</button>
                      <button onClick={() => deleteComment(item.id)} className="text-[11px] py-2 hover:bg-slate-50 font-bold text-red-500">삭제하기</button>
                    </div>
                  )}
                </div>
              </div>

              {editingId === item.id ? (
                <div className="mt-2">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full bg-slate-50 border border-blue-200 rounded-xl p-3 text-[13px] focus:outline-none focus:bg-white transition-all min-h-[80px]" />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-400 bg-slate-100"><X className="w-3 h-3"/> 취소</button>
                    <button onClick={() => saveEdit(item.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-white bg-blue-500"><Check className="w-3 h-3"/> 수정완료</button>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-slate-600 leading-relaxed mb-3 font-medium">{item.content}</p>
              )}

              <div className="flex items-center gap-2">
                <button onClick={() => handleReaction(item.id, 'good')} className="flex items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors bg-slate-50 px-2 py-1 rounded-full">
                  <ThumbsUp className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{item.good}</span>
                </button>
                <button onClick={() => handleReaction(item.id, 'bad')} className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors bg-slate-50 px-2 py-1 rounded-full">
                  <ThumbsDown className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{item.bad}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}