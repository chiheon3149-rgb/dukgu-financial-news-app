"use client"

import React from "react" // 💡 리액트 기초 도구 임포트
import { Send } from "lucide-react"

interface CommentInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  placeholder?: string
  userEmoji?: string
  disabled?: boolean
}

export function CommentInput({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder, 
  userEmoji, 
  disabled 
}: CommentInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3 mb-7">
      {/* 유저 에모지 (프로필 이미지 영역) */}
      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center text-lg shadow-sm">
        {userEmoji ?? "🐱"}
      </div>

      {/* 입력창과 전송 버튼 영역 */}
      <div className="flex-1 relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "댓글을 입력하세요"}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-4 pr-12 text-[14px] font-medium focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 transition-all"
        />
        
        {/* 💡 수직 중앙 정렬이 적용된 시원시원한 전송 버튼 */}
        <button 
          type="submit" 
          disabled={!value.trim() || disabled} 
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
            value.trim() 
              ? "text-emerald-500 bg-emerald-50" 
              : "text-slate-300 bg-transparent"
          }`}
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>
    </form>
  )
}