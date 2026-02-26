"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import type {
  CommunityPost,
  CommunityComment,
  CommunityCategory,
  CommentReportReason,
} from "@/types"
import { supabase } from "@/lib/supabase"

// 시간 포맷팅 함수
function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "방금 전"
  if (min < 60) return `${min}분 전`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d === 1) return "어제"
  if (d < 7) return `${d}일 전`
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })
}

// DB 데이터를 앱 타입으로 매핑 (Post)
function mapPost(row: any): CommunityPost {
  const author = row.author;
  return {
    id: row.id,
    category: row.category as CommunityCategory,
    tags: Array.isArray(row.tags) ? row.tags : [],
    title: row.title,
    content: row.content,
    authorId: row.author_id,
    authorNickname: author?.nickname ?? row.author_nickname ?? "알 수 없음",
    authorEmoji: author?.avatar_emoji ?? row.author_emoji ?? "🐶",
    authorLevel: author?.level ?? row.author_level ?? 1,
    publishedAt: row.published_at,
    timeAgo: formatTimeAgo(row.published_at),
    likeCount: row.like_count ?? 0,
    dislikeCount: row.dislike_count ?? 0,
    commentCount: row.comment_count ?? 0,
    viewCount: row.view_count ?? 0, 
    isDeleted: row.is_deleted ?? false,
  }
}

// DB 데이터를 앱 타입으로 매핑 (Comment)
function mapComment(row: any): CommunityComment {
  const author = row.author;
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorNickname: author?.nickname ?? row.author_nickname ?? "알 수 없음",
    authorEmoji: author?.avatar_emoji ?? row.author_emoji ?? "🐶",
    authorLevel: author?.level ?? row.author_level ?? 1,
    content: row.content,
    publishedAt: row.published_at,
    timeAgo: formatTimeAgo(row.published_at),
    likeCount: row.like_count ?? 0,
    dislikeCount: row.dislike_count ?? 0,
    reportCount: row.report_count ?? 0,
    isRemovedByAdmin: row.is_removed_by_admin ?? false,
  }
}

const DEVICE_KEY_STORAGE = "dukgu_device_id"
function getOrCreateDeviceKey(): string {
  if (typeof window === "undefined") return "ssr"
  let key = localStorage.getItem(DEVICE_KEY_STORAGE)
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY_STORAGE, key)
  }
  return key
}

interface UseCommunityReturn {
  posts: CommunityPost[]
  comments: CommunityComment[]
  isLoading: boolean
  activeCategory: CommunityCategory | "all"
  setActiveCategory: (cat: CommunityCategory | "all") => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  filteredPosts: CommunityPost[]
  getComments: (postId: string) => CommunityComment[]
  reportPost: (postId: string) => Promise<void>
  createPost: (data: any) => Promise<CommunityPost>
  updatePost: (postId: string, data: any) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  reactPost: (postId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => void
  addComment: (data: any) => void
  editComment: (commentId: string, content: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  reactComment: (commentId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => void
  reportComment: (report: any) => Promise<void>
  incrementViewCount: (postId: string) => Promise<void>
  fetchPosts: () => Promise<void> 
}

export function useCommunity(postId?: string): UseCommunityReturn {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<CommunityCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const selectQuery = `
        *,
        author:profiles (
          nickname,
          avatar_emoji,
          level
        )
      `
      if (postId) {
        const [{ data: postRow, error: postErr }, { data: commentRows }] = await Promise.all([
          supabase.from("community_posts").select(selectQuery).eq("id", postId).maybeSingle(),
          supabase
            .from("community_comments")
            .select(selectQuery)
            .eq("post_id", postId)
            .order("published_at", { ascending: true }),
        ])
        if (postErr || !postRow) return
        setPosts([mapPost(postRow)])
        setComments((commentRows ?? []).map(mapComment))
      } else {
        const { data: postRows, error } = await supabase
          .from("community_posts")
          .select(selectQuery)
          .eq("is_deleted", false)
          .order("published_at", { ascending: false })
          .limit(100)
        if (error || !postRows) return
        setPosts(postRows.map(mapPost))
      }
    } catch (e) {
      console.error("[useCommunity] 로딩 실패:", e)
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // 💡 [핵심 수정] RPC 함수(increment_community_view_count)를 사용하여 RLS 우회
  const incrementViewCount = useCallback(async (id: string) => {
    try {
      // 1. 화면의 숫자를 즉각 올려 유저에게 피드백을 줍니다.
      setPosts((prevPosts) => 
        prevPosts.map((p) => 
          p.id === id ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p
        )
      )

      // 2. DB에 전용 RPC 함수를 호출하여 실제 조회수를 올립니다.
      // (SQL Editor에서 생성한 increment_community_view_count를 사용합니다)
      await supabase.rpc('increment_community_view_count', { post_id: id });
      
    } catch (e) {
      console.error("[useCommunity] 조회수 업데이트 실패:", e);
    }
  }, []);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((p: CommunityPost) => !p.isDeleted)
      .filter((p: CommunityPost) => activeCategory === "all" || p.category === activeCategory)
      .filter((p: CommunityPost) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.authorNickname.toLowerCase().includes(q)
        )
      })
  }, [posts, activeCategory, searchQuery])

  const getComments = useCallback((id: string) => comments.filter((c) => c.postId === id), [comments])

  const createPost = useCallback(async (data: any): Promise<CommunityPost> => {
    const now = new Date().toISOString()
    const { data: inserted, error } = await supabase
      .from("community_posts")
      .insert({ ...data, like_count: 0, dislike_count: 0, comment_count: 0, view_count: 0, is_deleted: false, published_at: now })
      .select("id, published_at").single()

    if (error || !inserted) throw error ?? new Error("게시글 등록에 실패했습니다.")
    const newPost: CommunityPost = { ...data, id: inserted.id, publishedAt: inserted.published_at, timeAgo: "방금 전", likeCount: 0, dislikeCount: 0, commentCount: 0, viewCount: 0, isDeleted: false }
    setPosts((prev) => [newPost, ...prev])
    return newPost
  }, [])

  const updatePost = useCallback(async (postId: string, data: any) => {
    const { error } = await supabase.from("community_posts").update(data).eq("id", postId)
    if (error) throw error
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...data } : p)))
  }, [])

  const deletePost = useCallback(async (postId: string) => {
    const { error } = await supabase.from("community_posts").update({ is_deleted: true }).eq("id", postId)
    if (error) throw error
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const reactPost = useCallback((postId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => {
    const isToggleOff = currentReaction === type
    const userKey = userId ?? getOrCreateDeviceKey()
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p
      if (isToggleOff) return { ...p, likeCount: type === "like" ? p.likeCount - 1 : p.likeCount, dislikeCount: type === "dislike" ? p.dislikeCount - 1 : p.dislikeCount }
      return { ...p, likeCount: type === "like" ? p.likeCount + 1 : currentReaction === "like" ? p.likeCount - 1 : p.likeCount, dislikeCount: type === "dislike" ? p.dislikeCount + 1 : currentReaction === "dislike" ? p.dislikeCount - 1 : p.dislikeCount }
    }))
    const sync = async () => {
      if (isToggleOff) await supabase.from("community_post_reactions").delete().eq("post_id", postId).eq("user_key", userKey)
      else await supabase.from("community_post_reactions").upsert({ post_id: postId, user_key: userKey, reaction: type })
      const [{ count: l }, { count: d }] = await Promise.all([
        supabase.from("community_post_reactions").select("*", { count: "exact", head: true }).eq("post_id", postId).eq("reaction", "like"),
        supabase.from("community_post_reactions").select("*", { count: "exact", head: true }).eq("post_id", postId).eq("reaction", "dislike"),
      ])
      await supabase.from("community_posts").update({ like_count: l ?? 0, dislike_count: d ?? 0 }).eq("id", postId)
    }
    sync().catch(e => console.error(e))
  }, [userId])

  const addComment = useCallback((data: any) => {
    supabase.from("community_comments").insert({ ...data, published_at: new Date().toISOString() })
    setPosts((prev) => prev.map((p) => p.id !== data.postId ? p : { ...p, commentCount: p.commentCount + 1 }))
  }, [])

  const editComment = useCallback(async (commentId: string, content: string) => {
    await supabase.from("community_comments").update({ content }).eq("id", commentId)
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content } : c)))
  }, [])

  const deleteComment = useCallback(async (commentId: string) => {
    const target = comments.find((c) => c.id === commentId)
    await supabase.from("community_comments").delete().eq("id", commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    if (target) setPosts((prev) => prev.map((p) => p.id !== target.postId ? p : { ...p, commentCount: Math.max(0, p.commentCount - 1) }))
  }, [comments])

  const reactComment = useCallback((commentId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => {
    const userKey = userId ?? getOrCreateDeviceKey()
    const isToggleOff = currentReaction === type
    setComments((prev) => prev.map((c) => {
      if (c.id !== commentId) return c
      if (isToggleOff) return { ...c, likeCount: type === "like" ? c.likeCount - 1 : c.likeCount, dislikeCount: type === "dislike" ? c.dislikeCount - 1 : c.dislikeCount }
      return { ...c, likeCount: type === "like" ? c.likeCount + 1 : currentReaction === "like" ? c.likeCount - 1 : c.likeCount, dislikeCount: type === "dislike" ? c.dislikeCount + 1 : currentReaction === "dislike" ? c.dislikeCount - 1 : c.dislikeCount }
    }))
    const sync = async () => {
      if (isToggleOff) await supabase.from("community_comment_reactions").delete().eq("comment_id", commentId).eq("user_key", userKey)
      else await supabase.from("community_comment_reactions").upsert({ comment_id: commentId, user_key: userKey, reaction: type })
      const [{ count: l }, { count: d }] = await Promise.all([
        supabase.from("community_comment_reactions").select("*", { count: "exact", head: true }).eq("comment_id", commentId).eq("reaction", "like"),
        supabase.from("community_comment_reactions").select("*", { count: "exact", head: true }).eq("comment_id", commentId).eq("reaction", "dislike"),
      ])
      await supabase.from("community_comments").update({ like_count: l ?? 0, dislike_count: d ?? 0 }).eq("id", commentId)
    }
    sync().catch(e => console.error(e))
  }, [userId])

  const reportComment = useCallback(async (report: any) => {
    await supabase.from("comment_reports").insert({ ...report, reported_at: new Date().toISOString() })
    setComments((prev) => prev.map((c) => {
      if (c.id !== report.commentId) return c
      const newCount = c.reportCount + 1
      supabase.from("community_comments").update({ report_count: newCount, is_removed_by_admin: newCount >= 3 }).eq("id", c.id)
      return { ...c, reportCount: newCount, isRemovedByAdmin: newCount >= 3 }
    }))
  }, [])

  const reportPost = useCallback(async (postId: string) => {
    await fetch("/api/community/report", { method: "POST", body: JSON.stringify({ postId }) })
  }, [])

  return {
    posts, comments, isLoading, activeCategory, setActiveCategory, searchQuery, setSearchQuery, filteredPosts, getComments, reportPost, createPost, updatePost, deletePost, reactPost, addComment, editComment, deleteComment, reactComment, reportComment,
    incrementViewCount,
    fetchPosts 
  }
}