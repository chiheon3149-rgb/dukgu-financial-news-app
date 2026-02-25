"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import type {
  CommunityPost,
  CommunityComment,
  CommunityCategory,
  CommentReportReason,
} from "@/types"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 🏘️ useCommunity — Supabase 연동 버전
//
// postId 없이 호출 → 전체 게시글 목록 로드 (목록 페이지)
// postId 전달 시   → 해당 게시글 + 댓글만 로드 (상세 페이지)
//
// 실제 테이블 스키마:
//   community_posts    — published_at, author_nickname, author_emoji, author_level 포함
//   community_comments — published_at, author_nickname, author_emoji, author_level 포함
//   comment_reports    — comment_id, post_id, reason, detail, reported_at
// =============================================================================

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

function mapPost(row: any): CommunityPost {
  return {
    id: row.id,
    category: row.category as CommunityCategory,
    tags: Array.isArray(row.tags) ? row.tags : [],
    title: row.title,
    content: row.content,
    authorId: row.author_id,
    authorNickname: row.author_nickname ?? "알 수 없음",
    authorEmoji: row.author_emoji ?? "🐶",
    authorLevel: row.author_level ?? 1,
    publishedAt: row.published_at,
    timeAgo: formatTimeAgo(row.published_at),
    likeCount: row.like_count ?? 0,
    dislikeCount: row.dislike_count ?? 0,
    commentCount: row.comment_count ?? 0,
    isDeleted: row.is_deleted ?? false,
  }
}

function mapComment(row: any): CommunityComment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorNickname: row.author_nickname ?? "알 수 없음",
    authorEmoji: row.author_emoji ?? "🐶",
    authorLevel: row.author_level ?? 1,
    content: row.content,
    publishedAt: row.published_at,
    timeAgo: formatTimeAgo(row.published_at),
    likeCount: row.like_count ?? 0,
    dislikeCount: row.dislike_count ?? 0,
    reportCount: row.report_count ?? 0,
    isRemovedByAdmin: row.is_removed_by_admin ?? false,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

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
  createPost: (
    data: Omit<CommunityPost, "id" | "publishedAt" | "timeAgo" | "likeCount" | "dislikeCount" | "commentCount" | "isDeleted">
  ) => Promise<CommunityPost>
  updatePost: (
    postId: string,
    data: Pick<CommunityPost, "title" | "content" | "tags" | "category">
  ) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  reactPost: (postId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => void
  addComment: (
    data: Omit<CommunityComment, "id" | "publishedAt" | "timeAgo" | "likeCount" | "dislikeCount" | "reportCount" | "isRemovedByAdmin">
  ) => void
  editComment: (commentId: string, content: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  reactComment: (commentId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => void
  reportComment: (report: {
    commentId: string
    postId: string
    reason: CommentReportReason
    detail?: string
  }) => Promise<void>
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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        if (postId) {
          // 상세 페이지: 특정 게시글 + 댓글 로드
          const [{ data: postRow, error: postErr }, { data: commentRows }] = await Promise.all([
            supabase.from("community_posts").select("*").eq("id", postId).single(),
            supabase
              .from("community_comments")
              .select("*")
              .eq("post_id", postId)
              .order("published_at", { ascending: true }),
          ])
          if (postErr || !postRow) return
          setPosts([mapPost(postRow)])
          setComments((commentRows ?? []).map(mapComment))
        } else {
          // 목록 페이지: 전체 게시글 로드
          const { data: postRows, error } = await supabase
            .from("community_posts")
            .select("*")
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
    }
    load()
  }, [postId])

  const filteredPosts = useMemo(() => {
    return posts
      .filter((p) => !p.isDeleted)
      .filter((p) => activeCategory === "all" || p.category === activeCategory)
      .filter((p) => {
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

  const getComments = useCallback(
    (id: string) => comments.filter((c) => c.postId === id),
    [comments]
  )

  const createPost = useCallback(
    async (
      data: Omit<CommunityPost, "id" | "publishedAt" | "timeAgo" | "likeCount" | "dislikeCount" | "commentCount" | "isDeleted">
    ): Promise<CommunityPost> => {
      const now = new Date().toISOString()
      const { data: inserted, error } = await supabase
        .from("community_posts")
        .insert({
          category: data.category,
          tags: data.tags,
          title: data.title,
          content: data.content,
          author_id: data.authorId,
          author_nickname: data.authorNickname,
          author_emoji: data.authorEmoji,
          author_level: data.authorLevel,
          like_count: 0,
          dislike_count: 0,
          comment_count: 0,
          is_deleted: false,
          published_at: now,
        })
        .select("id, published_at")
        .single()

      if (error || !inserted) throw error ?? new Error("게시글 등록에 실패했습니다.")

      const newPost: CommunityPost = {
        ...data,
        id: inserted.id,
        publishedAt: inserted.published_at,
        timeAgo: "방금 전",
        likeCount: 0,
        dislikeCount: 0,
        commentCount: 0,
        isDeleted: false,
      }
      setPosts((prev) => [newPost, ...prev])
      return newPost
    },
    []
  )

  const updatePost = useCallback(
    async (postId: string, data: Pick<CommunityPost, "title" | "content" | "tags" | "category">) => {
      const { error } = await supabase
        .from("community_posts")
        .update({
          title: data.title,
          content: data.content,
          tags: data.tags,
          category: data.category,
        })
        .eq("id", postId)
      if (error) throw error
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...data } : p))
      )
    },
    []
  )

  const deletePost = useCallback(async (postId: string) => {
    const { error } = await supabase
      .from("community_posts")
      .update({ is_deleted: true })
      .eq("id", postId)
    if (error) throw error
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const reactPost = useCallback((postId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => {
    const isToggleOff = currentReaction === type
    const userKey = userId ?? getOrCreateDeviceKey()

    // 낙관적 UI 업데이트
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        if (isToggleOff) {
          return {
            ...p,
            likeCount:    type === "like"    ? Math.max(0, p.likeCount    - 1) : p.likeCount,
            dislikeCount: type === "dislike" ? Math.max(0, p.dislikeCount - 1) : p.dislikeCount,
          }
        }
        return {
          ...p,
          likeCount:    type === "like"    ? p.likeCount    + 1 : currentReaction === "like"    ? Math.max(0, p.likeCount    - 1) : p.likeCount,
          dislikeCount: type === "dislike" ? p.dislikeCount + 1 : currentReaction === "dislike" ? Math.max(0, p.dislikeCount - 1) : p.dislikeCount,
        }
      })
    )

    // 반응 저장 후 실제 카운트를 community_posts에 동기화
    const syncPostReaction = async () => {
      if (isToggleOff) {
        await supabase.from("community_post_reactions").delete()
          .eq("post_id", postId).eq("user_key", userKey)
      } else {
        await supabase.from("community_post_reactions")
          .upsert({ post_id: postId, user_key: userKey, reaction: type }, { onConflict: "post_id,user_key" })
      }

      // 실제 카운트 집계 후 community_posts 업데이트
      const [{ count: likeCount, error: le }, { count: dislikeCount, error: de }] = await Promise.all([
        supabase.from("community_post_reactions").select("*", { count: "exact", head: true })
          .eq("post_id", postId).eq("reaction", "like"),
        supabase.from("community_post_reactions").select("*", { count: "exact", head: true })
          .eq("post_id", postId).eq("reaction", "dislike"),
      ])
      if (le || de || likeCount === null || dislikeCount === null) return

      await supabase.from("community_posts").update({
        like_count:    likeCount,
        dislike_count: dislikeCount,
      }).eq("id", postId)
    }

    syncPostReaction().catch((e) => console.error("[useCommunity] reactPost 실패:", e))
  }, [userId])

  const addComment = useCallback(
    (
      data: Omit<CommunityComment, "id" | "publishedAt" | "timeAgo" | "likeCount" | "dislikeCount" | "reportCount" | "isRemovedByAdmin">
    ) => {
      // DB 저장 (CommentSection이 로컬 UI 자체 관리)
      supabase
        .from("community_comments")
        .insert({
          post_id: data.postId,
          author_id: data.authorId,
          author_nickname: data.authorNickname,
          author_emoji: data.authorEmoji,
          author_level: data.authorLevel,
          content: data.content,
          like_count: 0,
          dislike_count: 0,
          report_count: 0,
          is_removed_by_admin: false,
          published_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error("[useCommunity] 댓글 저장 실패:", error)
        })

      // 낙관적 UI 업데이트 (DB 카운트는 트리거가 처리)
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== data.postId ? p : { ...p, commentCount: p.commentCount + 1 }
        )
      )
    },
    []
  )

  const editComment = useCallback(async (commentId: string, content: string) => {
    const { error } = await supabase
      .from("community_comments")
      .update({ content })
      .eq("id", commentId)
    if (error) throw error
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, content } : c))
    )
  }, [])

  const deleteComment = useCallback(async (commentId: string) => {
    const target = comments.find((c) => c.id === commentId)
    const { error } = await supabase
      .from("community_comments")
      .delete()
      .eq("id", commentId)
    if (error) throw error
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    // 낙관적 UI 업데이트 (DB 카운트는 트리거가 처리)
    if (target) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== target.postId ? p : { ...p, commentCount: Math.max(0, p.commentCount - 1) }
        )
      )
    }
  }, [comments])

  const reactComment = useCallback((commentId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => {
    const isToggleOff = currentReaction === type
    const userKey = userId ?? getOrCreateDeviceKey()

    // 낙관적 UI 업데이트
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c
        if (isToggleOff) {
          return {
            ...c,
            likeCount:    type === "like"    ? Math.max(0, c.likeCount    - 1) : c.likeCount,
            dislikeCount: type === "dislike" ? Math.max(0, c.dislikeCount - 1) : c.dislikeCount,
          }
        }
        return {
          ...c,
          likeCount:    type === "like"    ? c.likeCount    + 1 : currentReaction === "like"    ? Math.max(0, c.likeCount    - 1) : c.likeCount,
          dislikeCount: type === "dislike" ? c.dislikeCount + 1 : currentReaction === "dislike" ? Math.max(0, c.dislikeCount - 1) : c.dislikeCount,
        }
      })
    )

    // community_comment_reactions upsert/delete 후 실제 카운트를 community_comments에 반영
    const syncCounts = async () => {
      if (isToggleOff) {
        await supabase.from("community_comment_reactions").delete()
          .eq("comment_id", commentId).eq("user_key", userKey)
      } else {
        await supabase.from("community_comment_reactions")
          .upsert({ comment_id: commentId, user_key: userKey, reaction: type }, { onConflict: "comment_id,user_key" })
      }

      // 실제 카운트 집계 후 community_comments 테이블 업데이트
      const [{ count: likeCount, error: le }, { count: dislikeCount, error: de }] = await Promise.all([
        supabase.from("community_comment_reactions").select("*", { count: "exact", head: true })
          .eq("comment_id", commentId).eq("reaction", "like"),
        supabase.from("community_comment_reactions").select("*", { count: "exact", head: true })
          .eq("comment_id", commentId).eq("reaction", "dislike"),
      ])

      // 집계 실패 시 낙관적 UI 값을 0으로 리셋하지 않음
      if (le || de || likeCount === null || dislikeCount === null) return

      await supabase.from("community_comments").update({
        like_count:    likeCount,
        dislike_count: dislikeCount,
      }).eq("id", commentId)
    }

    syncCounts().catch((e) => console.error("[useCommunity] reactComment 실패:", e))
  }, [userId])

  const reportComment = useCallback(
    async (report: {
      commentId: string
      postId: string
      reason: CommentReportReason
      detail?: string
    }) => {
      // Supabase에 신고 저장
      const { error } = await supabase.from("comment_reports").insert({
        comment_id: report.commentId,
        post_id: report.postId,
        reason: report.reason,
        detail: report.detail ?? null,
        reported_at: new Date().toISOString(),
      })
      if (error) console.error("[useCommunity] 신고 저장 실패:", error)

      // 신고 횟수 증가 + 3회 이상 자동 블라인드
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== report.commentId) return c
          const newCount = c.reportCount + 1
          supabase
            .from("community_comments")
            .update({
              report_count: newCount,
              ...(newCount >= 3 ? { is_removed_by_admin: true } : {}),
            })
            .eq("id", c.id)
          return { ...c, reportCount: newCount, isRemovedByAdmin: newCount >= 3 }
        })
      )

      // 관리자 알림 API
      try {
        await fetch("/api/community/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...report, reportedAt: new Date().toISOString() }),
        })
      } catch {
        // silent
      }
    },
    []
  )

  const reportPost = useCallback(async (postId: string) => {
    try {
      await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reportedAt: new Date().toISOString() }),
      })
    } catch {
      // silent
    }
  }, [])

  return {
    posts,
    comments,
    isLoading,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    filteredPosts,
    getComments,
    reportPost,
    createPost,
    updatePost,
    deletePost,
    reactPost,
    addComment,
    editComment,
    deleteComment,
    reactComment,
    reportComment,
  }
}
