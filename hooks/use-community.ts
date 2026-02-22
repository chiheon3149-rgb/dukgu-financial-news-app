"use client"

import { useState, useMemo, useCallback } from "react"
import type {
  CommunityPost,
  CommunityComment,
  CommunityCategory,
  CommentReport,
  CommentReportReason,
} from "@/types"
import { MOCK_COMMUNITY_POSTS, MOCK_COMMUNITY_COMMENTS } from "@/lib/mock/community"

// =============================================================================
// 🏘️ useCommunity
//
// 게시판 전체 상태를 관리합니다.
// 현재는 메모리 상태(+ localStorage)로 동작하며,
// Supabase 전환 시 각 함수 내부의 setXxx 호출을 API 호출로 교체합니다.
// =============================================================================

interface UseCommunityReturn {
  posts: CommunityPost[]
  comments: CommunityComment[]
  /** 현재 선택된 카테고리 필터 */
  activeCategory: CommunityCategory | "all"
  setActiveCategory: (cat: CommunityCategory | "all") => void
  /** 검색어 */
  searchQuery: string
  setSearchQuery: (q: string) => void
  /** 필터 + 검색 적용된 게시글 목록 */
  filteredPosts: CommunityPost[]
  /** 특정 게시글의 댓글 목록 */
  getComments: (postId: string) => CommunityComment[]
  /** 게시글 작성 */
  createPost: (data: Omit<CommunityPost, "id" | "publishedAt" | "timeAgo" | "likeCount" | "dislikeCount" | "commentCount" | "isDeleted">) => CommunityPost
  /** 게시글 반응 */
  reactPost: (postId: string, type: "like" | "dislike") => void
  /** 댓글 작성 */
  addComment: (data: Omit<CommunityComment, "id" | "publishedAt" | "timeAgo" | "likeCount" | "dislikeCount" | "reportCount" | "isRemovedByAdmin">) => void
  /** 댓글 반응 */
  reactComment: (commentId: string, type: "like" | "dislike") => void
  /** 댓글 신고 */
  reportComment: (report: { commentId: string; postId: string; reason: CommentReportReason; detail?: string }) => Promise<void>
}

export function useCommunity(): UseCommunityReturn {
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_COMMUNITY_POSTS)
  const [comments, setComments] = useState<CommunityComment[]>(MOCK_COMMUNITY_COMMENTS)
  const [activeCategory, setActiveCategory] = useState<CommunityCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // 필터 + 검색 적용
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
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  }, [posts, activeCategory, searchQuery])

  const getComments = useCallback(
    (postId: string) => comments.filter((c) => c.postId === postId),
    [comments]
  )

  const createPost = useCallback(
    (data: Omit<CommunityPost, "id" | "publishedAt" | "timeAgo" | "likeCount" | "dislikeCount" | "commentCount" | "isDeleted">): CommunityPost => {
      const newPost: CommunityPost = {
        ...data,
        id: `post-${Date.now()}`,
        publishedAt: new Date().toISOString(),
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

  const reactPost = useCallback((postId: string, type: "like" | "dislike") => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likeCount: type === "like" ? p.likeCount + 1 : p.likeCount, dislikeCount: type === "dislike" ? p.dislikeCount + 1 : p.dislikeCount }
          : p
      )
    )
  }, [])

  const addComment = useCallback(
    (data: Omit<CommunityComment, "id" | "publishedAt" | "timeAgo" | "likeCount" | "dislikeCount" | "reportCount" | "isRemovedByAdmin">) => {
      const newComment: CommunityComment = {
        ...data,
        id: `cmt-${Date.now()}`,
        publishedAt: new Date().toISOString(),
        timeAgo: "방금 전",
        likeCount: 0,
        dislikeCount: 0,
        reportCount: 0,
        isRemovedByAdmin: false,
      }
      setComments((prev) => [...prev, newComment])
      // 댓글 수 업데이트
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId ? { ...p, commentCount: p.commentCount + 1 } : p
        )
      )
    },
    []
  )

  const reactComment = useCallback((commentId: string, type: "like" | "dislike") => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likeCount: type === "like" ? c.likeCount + 1 : c.likeCount, dislikeCount: type === "dislike" ? c.dislikeCount + 1 : c.dislikeCount, reportCount: c.reportCount }
          : c
      )
    )
  }, [])

  const reportComment = useCallback(
    async (report: { commentId: string; postId: string; reason: CommentReportReason; detail?: string }) => {
      // 신고 횟수 증가
      setComments((prev) =>
        prev.map((c) =>
          c.id === report.commentId
            ? {
                ...c,
                reportCount: c.reportCount + 1,
                // 신고 3회 이상이면 자동 블라인드 처리 (관리자 확인 전 임시)
                isRemovedByAdmin: c.reportCount + 1 >= 3,
              }
            : c
        )
      )

      // API로 신고 전송 — 관리자 이메일 발송
      try {
        await fetch("/api/community/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...report,
            reportedAt: new Date().toISOString(),
          } satisfies CommentReport),
        })
      } catch {
        // 네트워크 에러 시 조용히 처리 (신고 자체는 로컬에 반영됨)
      }
    },
    []
  )

  return {
    posts,
    comments,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    filteredPosts,
    getComments,
    createPost,
    reactPost,
    addComment,
    reactComment,
    reportComment,
  }
}
