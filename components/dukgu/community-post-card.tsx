"use client"

import Link from "next/link"
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react"
import type { CommunityPost } from "@/types"
import { useState } from "react"

interface CommunityPostCardProps {
  post: CommunityPost
  onReact: (postId: string, type: "like" | "dislike") => void
  /** 프로필 클릭 시 콜백 (커뮤니티 → 상대 프로필로 이동) */
  onProfileClick?: (authorId: string) => void
}

const CATEGORY_LABEL: Record<CommunityPost["category"], string> = {
  free: "자유",
  economy: "경제",
}

const CATEGORY_COLOR: Record<CommunityPost["category"], string> = {
  free: "bg-slate-100 text-slate-600",
  economy: "bg-emerald-50 text-emerald-700",
}

export function CommunityPostCard({ post, onReact, onProfileClick }: CommunityPostCardProps) {
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null)
  const [counts, setCounts] = useState({ like: post.likeCount, dislike: post.dislikeCount })

  const handleReact = (type: "like" | "dislike") => {
    if (reaction === type) return
    setCounts((prev) => ({
      like: type === "like" ? prev.like + 1 : reaction === "like" ? prev.like - 1 : prev.like,
      dislike: type === "dislike" ? prev.dislike + 1 : reaction === "dislike" ? prev.dislike - 1 : prev.dislike,
    }))
    setReaction(type)
    onReact(post.id, type)
  }

  return (
    <article className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      {/* 작성자 정보 */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <button
          onClick={(e) => { e.preventDefault(); onProfileClick?.(post.authorId) }}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity active:scale-95"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-base">
            {post.authorEmoji}
          </div>
          <div className="text-left">
            <p className="text-[12px] font-black text-slate-700">{post.authorNickname}</p>
            <p className="text-[9px] font-bold text-slate-400">Lv.{post.authorLevel} · {post.timeAgo}</p>
          </div>
        </button>

        {/* 카테고리 뱃지 */}
        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${CATEGORY_COLOR[post.category]}`}>
          {CATEGORY_LABEL[post.category]}
        </span>
      </div>

      {/* 본문 — 클릭 시 상세 페이지로 이동 */}
      <Link href={`/community/${post.id}`} className="block px-5 pb-3">
        <h3 className="text-[14px] font-black text-slate-800 mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
          {post.content}
        </p>

        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-bold text-blue-500">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* 반응 바 */}
      <div className="px-5 pb-4 flex items-center gap-3 border-t border-slate-50 pt-3">
        <button
          onClick={() => handleReact("like")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all active:scale-95 ${
            reaction === "like" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${reaction === "like" ? "fill-emerald-500" : ""}`} />
          <span className="text-[11px] font-black">{counts.like}</span>
        </button>

        <button
          onClick={() => handleReact("dislike")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all active:scale-95 ${
            reaction === "dislike" ? "bg-rose-50 text-rose-500" : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <ThumbsDown className={`w-3.5 h-3.5 ${reaction === "dislike" ? "fill-rose-500" : ""}`} />
          <span className="text-[11px] font-black">{counts.dislike}</span>
        </button>

        <Link href={`/community/${post.id}`} className="flex items-center gap-1 text-slate-400 ml-auto">
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">{post.commentCount}</span>
        </Link>
      </div>
    </article>
  )
}
