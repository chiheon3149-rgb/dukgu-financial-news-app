"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ThumbsUp, ThumbsDown, User } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { CommentSection } from "@/components/dukgu/comment-section"
import { useCommunity } from "@/hooks/use-community"
import { useUser } from "@/context/user-context"
import type { CommunityCategory } from "@/types"

const CATEGORY_LABEL: Record<CommunityCategory, string> = { free: "자유", economy: "경제" }

export default function CommunityPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { posts, getComments, reactPost, addComment, reportComment } = useCommunity()
  const { profile, currentLevel } = useUser()

  const post = posts.find((p) => p.id === params.id)
  const comments = getComments(params.id)

  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null)
  const [counts, setCounts] = useState({ like: post?.likeCount ?? 0, dislike: post?.dislikeCount ?? 0 })

  const handleReact = (type: "like" | "dislike") => {
    if (reaction === type || !post) return
    setCounts((prev) => ({
      like: type === "like" ? prev.like + 1 : reaction === "like" ? prev.like - 1 : prev.like,
      dislike: type === "dislike" ? prev.dislike + 1 : reaction === "dislike" ? prev.dislike - 1 : prev.dislike,
    }))
    setReaction(type)
    reactPost(post.id, type)
  }

  if (!post) {
    return (
      <div className="min-h-dvh bg-slate-50 pb-24">
        <DetailHeader title="게시글" />
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
          게시글을 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  const currentUser = profile
    ? { id: profile.id, nickname: profile.nickname, emoji: profile.avatarEmoji, level: currentLevel.level }
    : { id: "user-001", nickname: "나", emoji: "🐶", level: 1 }

  return (
    <div className="min-h-dvh bg-white pb-24">
      <DetailHeader title={CATEGORY_LABEL[post.category] + " 게시판"} />

      <main className="max-w-md mx-auto px-5 py-6">
        {/* 작성자 */}
        <button
          onClick={() => router.push(`/profile/${post.authorId}`)}
          className="flex items-center gap-3 mb-5 hover:opacity-70 transition-opacity active:scale-95"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl">
            {post.authorEmoji}
          </div>
          <div className="text-left">
            <p className="text-[14px] font-black text-slate-800">{post.authorNickname}</p>
            <p className="text-[11px] font-bold text-slate-400">
              Lv.{post.authorLevel} · {post.timeAgo}
            </p>
          </div>
          <User className="w-4 h-4 text-slate-300 ml-auto" />
        </button>

        {/* 카테고리 뱃지 */}
        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full mb-3 inline-block ${
          post.category === "economy" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
        }`}>
          {CATEGORY_LABEL[post.category]}
        </span>

        {/* 제목 */}
        <h1 className="text-[20px] font-black text-slate-900 leading-snug mb-3">
          {post.title}
        </h1>

        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-bold text-blue-500">#{tag}</span>
            ))}
          </div>
        )}

        {/* 본문 */}
        <p className="text-[14px] text-slate-600 leading-relaxed font-medium whitespace-pre-wrap mb-6">
          {post.content}
        </p>

        {/* 반응 바 */}
        <div className="flex items-center gap-3 py-4 border-t border-b border-slate-100 mb-2">
          <button
            onClick={() => handleReact("like")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all active:scale-95 ${
              reaction === "like" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-50 text-slate-500 border border-slate-100"
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${reaction === "like" ? "fill-emerald-500" : ""}`} />
            <span className="text-[12px] font-black">{counts.like}</span>
          </button>
          <button
            onClick={() => handleReact("dislike")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all active:scale-95 ${
              reaction === "dislike" ? "bg-rose-50 text-rose-500 border border-rose-200" : "bg-slate-50 text-slate-500 border border-slate-100"
            }`}
          >
            <ThumbsDown className={`w-4 h-4 ${reaction === "dislike" ? "fill-rose-500" : ""}`} />
            <span className="text-[12px] font-black">{counts.dislike}</span>
          </button>
        </div>

        {/* 댓글 섹션 */}
        <CommentSection
          postId={post.id}
          initialComments={comments}
          currentUser={currentUser}
          onReport={reportComment}
          onAddComment={addComment}
        />
      </main>
    </div>
  )
}
