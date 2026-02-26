"use client"

import { use, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ThumbsUp, ThumbsDown, User, Loader2, MoreVertical, Pencil, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { CommentSection } from "@/components/dukgu/comment-section"
import { ShareButton } from "@/components/dukgu/share-button"
import { YoutubePlayer } from "@/components/dukgu/youtube-player"
import { getYoutubeIds } from "@/lib/youtube"
import { useCommunity } from "@/hooks/use-community"
import { useUser } from "@/context/user-context"
import type { CommunityPost, CommunityCategory } from "@/types"

const CATEGORY_LABEL: Record<CommunityCategory, string> = { free: "자유", economy: "경제" }

export default function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const { 
    posts, 
    isLoading, 
    incrementViewCount, 
    getComments, 
    reactPost, 
    addComment, 
    editComment, 
    deleteComment, 
    reactComment, 
    reportComment, 
    deletePost 
  } = useCommunity(id)
  
  const { profile, currentLevel } = useUser()

  const post = posts.find((p: CommunityPost) => p.id === id)
  const comments = getComments(id)

  // 💡 [조회수 중복 방지] "이미 카운트했는지" 기억하는 메모장
  const hasIncremented = useRef(false);

  // 💡 [조회수 로직] 렌더링이 두 번 되어도 한 번만 실행되도록 제어
  useEffect(() => {
    if (id && !hasIncremented.current) {
      incrementViewCount(id);
      hasIncremented.current = true; // "이번 방문엔 카운트 완료!" 표시
    }
  }, [id, incrementViewCount]);

  const videoIds = post?.content ? getYoutubeIds(post.content) : []

  const REACTION_KEY = "dukgu:community_post_reactions"
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null)
  const [counts, setCounts] = useState({ like: 0, dislike: 0 })
  const countsInitRef = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cache = JSON.parse(localStorage.getItem(REACTION_KEY) ?? "{}")
        setReaction(cache[id] ?? null)
      } catch { /* 캐시 에러 무시 */ }
    }
  }, [id])

  useEffect(() => {
    if (!post || countsInitRef.current) return
    countsInitRef.current = true
    setCounts({ like: post.likeCount, dislike: post.dislikeCount })
  }, [post])

  const [isDeleting, setIsDeleting] = useState(false)
  const isMyPost = !!profile && post?.authorId === profile.id

  const handleReact = (type: "like" | "dislike") => {
    if (!post) return
    countsInitRef.current = true
    const isToggleOff = reaction === type
    
    if (isToggleOff) {
      setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }))
      setReaction(null)
    } else {
      setCounts(prev => ({
        like: type === "like" ? prev.like + 1 : (reaction === "like" ? prev.like - 1 : prev.like),
        dislike: type === "dislike" ? prev.dislike + 1 : (reaction === "dislike" ? prev.dislike - 1 : prev.dislike),
      }))
      setReaction(type)
    }

    reactPost(post.id, type, reaction)
    try {
      const cache = JSON.parse(localStorage.getItem(REACTION_KEY) ?? "{}")
      if (isToggleOff) delete cache[id] 
      else cache[id] = type
      localStorage.setItem(REACTION_KEY, JSON.stringify(cache))
    } catch {}
  }

  const performDelete = async () => {
    if (!post) return
    setIsDeleting(true)
    try {
      await deletePost(post.id)
      toast.success("게시글이 삭제되었습니다냥! 🐾")
      router.replace("/community")
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.")
      setIsDeleting(false)
    }
  }

  const handleDelete = () => {
    if (!post) return
    toast("게시글을 삭제하시겠습니까?", {
      action: { 
        label: "삭제", 
        onClick: () => performDelete() 
      },
      cancel: { label: "취소", onClick: () => {} },
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-slate-50 pb-24">
        <DetailHeader title="게시글" />
        <div className="flex items-center justify-center h-40 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-dvh bg-slate-50 pb-24">
        <DetailHeader title="게시글" />
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm font-bold">
          사라진 게시글이다냥! 🐾
        </div>
      </div>
    )
  }

  const currentUser = profile
    ? { id: profile.id, nickname: profile.nickname, emoji: profile.avatarEmoji, level: currentLevel.level }
    : { id: "guest", nickname: "손님", emoji: "👤", level: 1 }

  return (
    <div className="min-h-dvh bg-white pb-24" onClick={() => setMenuOpen(false)}>
      <DetailHeader
        title={CATEGORY_LABEL[post.category as CommunityCategory] + " 게시판"}
        rightElement={
          <div className="flex items-center gap-1">
            <ShareButton
              title={`[덕구의 커뮤니티] ${post.title}`}
              text="덕구 커뮤니티에서 흥미로운 이야기를 확인해봐라냥! 🐾"
              className="p-1.5 hover:bg-slate-100 rounded-full"
            />
            {isMyPost && (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                  disabled={isDeleting}
                >
                  <MoreVertical className="w-5 h-5 text-slate-500" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 bg-white border border-slate-100 shadow-xl rounded-2xl py-1.5 z-30 min-w-[120px] animate-in zoom-in-95 duration-100">
                    <button
                      onClick={() => { setMenuOpen(false); router.push(`/community/${post.id}/edit`) }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50 text-left"
                    >
                      <Pencil className="w-3.5 h-3.5" /> 수정하기
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); handleDelete() }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold text-rose-500 hover:bg-rose-50 text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />

      <main className="max-w-md mx-auto px-5 py-6">
        <button
          onClick={() => router.push(`/profile/${post.authorId}`)}
          className="flex items-center gap-3 mb-5 hover:opacity-70 transition-opacity active:scale-95"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl">
            {post.authorEmoji}
          </div>
          <div className="text-left">
            <p className="text-[14px] font-black text-slate-800">{post.authorNickname}</p>
            <p className="text-[11px] font-bold text-slate-400">Lv.{post.authorLevel} · {post.timeAgo}</p>
          </div>
          <User className="w-4 h-4 text-slate-300 ml-auto" />
        </button>

        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block ${
            post.category === "economy" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}>
            {CATEGORY_LABEL[post.category as CommunityCategory]}
          </span>
          
          <div className="flex items-center gap-1 text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">{post.viewCount || 0}</span>
          </div>
        </div>

        <h1 className="text-[20px] font-black text-slate-900 leading-snug mb-3">{post.title}</h1>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((tag) => <span key={tag} className="text-[11px] font-bold text-blue-500">#{tag}</span>)}
          </div>
        )}

        {videoIds.length > 0 && (
          <div className="space-y-4 mb-6">
            {videoIds.map((vId) => (
              <div key={vId} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <YoutubePlayer videoId={vId} />
              </div>
            ))}
          </div>
        )}

        <p className="text-[14px] text-slate-600 leading-relaxed font-medium whitespace-pre-wrap mb-6">
          {post.content}
        </p>

        <div className="flex items-center gap-3 py-4 border-t border-b border-slate-100 mb-2">
          <button onClick={() => handleReact("like")} className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${reaction === "like" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-100"}`}>
            <ThumbsUp className={`w-4 h-4 ${reaction === "like" ? "fill-emerald-500" : ""}`} />
            <span className="text-[12px] font-black">{counts.like}</span>
          </button>
          <button onClick={() => handleReact("dislike")} className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all ${reaction === "dislike" ? "bg-rose-50 text-rose-500 border-rose-200" : "bg-slate-50 text-slate-500 border-slate-100"}`}>
            <ThumbsDown className={`w-4 h-4 ${reaction === "dislike" ? "fill-rose-500" : ""}`} />
            <span className="text-[12px] font-black">{counts.dislike}</span>
          </button>
        </div>

        <CommentSection
          postId={post.id}
          initialComments={comments}
          currentUser={currentUser}
          onReport={reportComment}
          onAddComment={addComment}
          onSaveEdit={editComment}
          onDeleteComment={deleteComment}
          onReact={reactComment}
        />
      </main>
    </div>
  )
}