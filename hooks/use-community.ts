"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import type {
  CommunityPost,
  CommunityComment,
  CommunityCategory,
} from "@/types"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 💡 전역 금고 & 무전기 시스템
// =============================================================================
let _cachedPosts: CommunityPost[] = [];
const COMMUNITY_SYNC_EVENT = "COMMUNITY_SYNC_EVENT";

function notifyCommunityUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COMMUNITY_SYNC_EVENT));
  }
}

function updateCachedPost(postId: string, patch: Partial<CommunityPost>) {
  const idx = _cachedPosts.findIndex(p => p.id === postId);
  if (idx !== -1) {
    _cachedPosts[idx] = { ..._cachedPosts[idx], ...patch };
    notifyCommunityUpdate();
  }
}

// =============================================================================
// 헬퍼 함수
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

function mapComment(row: any): CommunityComment {
  // 댓글은 이미 테이블 자체에 닉네임과 이모지가 저장되어 있으므로 그걸 바로 씁니다!
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

// =============================================================================
// 🚀 최종 도구함 (Hook)
// =============================================================================
export function useCommunity(postId?: string) {
  const [posts, setPosts] = useState<CommunityPost[]>(_cachedPosts)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<CommunityCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [userReactions, setUserReactions] = useState<Record<string, "like" | "dislike">>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  // 로그인 유저의 실제 반응을 DB에서 일괄 조회 (새로고침 후 상태 복원)
  useEffect(() => {
    if (!userId) return
    supabase
      .from("community_post_reactions")
      .select("post_id, reaction")
      .eq("user_key", userId)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, "like" | "dislike"> = {}
        data.forEach(r => { map[r.post_id] = r.reaction as "like" | "dislike" })
        setUserReactions(map)
      })
  }, [userId])

  useEffect(() => {
    const handleSync = () => setPosts([..._cachedPosts]);
    window.addEventListener(COMMUNITY_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(COMMUNITY_SYNC_EVENT, handleSync);
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      // 💡 [핵심 수리] 게시글용 쿼리와 댓글용 쿼리를 분리했습니다!
      const postSelectQuery = `*, author:profiles (nickname, avatar_emoji, level)`
      
      if (postId) {
        const [
          { data: postRow, error: postErr }, 
          { data: commentRows, error: commentErr } 
        ] = await Promise.all([
          supabase.from("community_posts").select(postSelectQuery).eq("id", postId).maybeSingle(),
          // 🚨 댓글은 억지로 프로필과 조인하지 않고 전체(*)만 깔끔하게 가져옵니다.
          supabase.from("community_comments").select("*").eq("post_id", postId).order("published_at", { ascending: true }),
        ])
        
        if (postErr || !postRow) return
        
        if (commentErr) {
          console.error("🚨 댓글 불러오기 실패:", commentErr.message, commentErr.hint);
        }

        const post = mapPost(postRow);
        updateCachedPost(post.id, post);
        setComments((commentRows ?? []).map(mapComment))
      } else {
        const { data: postRows, error } = await supabase
          .from("community_posts").select(postSelectQuery).eq("is_deleted", false).order("published_at", { ascending: false }).limit(100)
        if (error || !postRows) return
        const mapped = postRows.map(mapPost);
        _cachedPosts = mapped;
        setPosts(mapped)
      }
    } catch (e) {
      console.error("[useCommunity] 로딩 실패:", e)
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const createPost = useCallback(async (data: any): Promise<CommunityPost> => {
    const now = new Date().toISOString()
    const { data: inserted, error } = await supabase
      .from("community_posts")
      .insert({ 
        ...data, 
        like_count: 0, 
        dislike_count: 0, 
        comment_count: 0, 
        view_count: 0, 
        is_deleted: false, 
        published_at: now 
      })
      .select("id, published_at").single()
    
    if (error || !inserted) throw error ?? new Error("게시글 생성 실패")
    
    const newPost: CommunityPost = { 
      ...data, 
      id: inserted.id, 
      publishedAt: inserted.published_at, 
      timeAgo: "방금 전", 
      likeCount: 0, 
      dislikeCount: 0, 
      commentCount: 0, 
      viewCount: 0, 
      isDeleted: false 
    }
    
    _cachedPosts = [newPost, ..._cachedPosts];
    notifyCommunityUpdate();
    
    return newPost
  }, [])

  const updatePost = useCallback(async (postId: string, data: any) => {
    await supabase.from("community_posts").update(data).eq("id", postId)
    updateCachedPost(postId, data);
  }, [])

  const deletePost = useCallback(async (postId: string) => {
    await supabase.from("community_posts").update({ is_deleted: true }).eq("id", postId)
    _cachedPosts = _cachedPosts.filter(p => p.id !== postId);
    notifyCommunityUpdate();
  }, [])

  const incrementViewCount = useCallback(async (id: string) => {
    try {
      const target = _cachedPosts.find(p => p.id === id);
      const newCount = (target?.viewCount || 0) + 1;
      updateCachedPost(id, { viewCount: newCount });
      await supabase.rpc('increment_community_view_count', { target_post_id: id });
    } catch (e) { console.error(e) }
  }, []);

  // 💡 [좋아요/싫어요] 카운트는 DB 트리거가 단독 관리, 직접 update 제거로 이중 증가 방지
  const reactPost = useCallback((postId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => {
    const isToggleOff = currentReaction === type
    const userKey = userId ?? getOrCreateDeviceKey()
    const target = _cachedPosts.find(p => p.id === postId);

    if (target) {
      let newLike = target.likeCount;
      let newDislike = target.dislikeCount;

      if (isToggleOff) {
        if (type === "like") newLike = Math.max(0, newLike - 1);
        if (type === "dislike") newDislike = Math.max(0, newDislike - 1);
      } else {
        if (type === "like") {
          newLike += 1;
          if (currentReaction === "dislike") newDislike = Math.max(0, newDislike - 1);
        }
        if (type === "dislike") {
          newDislike += 1;
          if (currentReaction === "like") newLike = Math.max(0, newLike - 1);
        }
      }

      // 낙관적 UI 업데이트만 (DB 직접 update 제거 - 트리거가 처리)
      updateCachedPost(postId, { likeCount: newLike, dislikeCount: newDislike });
    }

    // userReactions 상태 동기화
    setUserReactions(prev => {
      const next = { ...prev }
      if (isToggleOff) delete next[postId]
      else next[postId] = type
      return next
    })

    // DB: 명시적 INSERT / UPDATE(반응 전환) / DELETE — upsert 제거로 트리거 오발 방지
    const sync = async () => {
      if (isToggleOff) {
        await supabase.from("community_post_reactions")
          .delete().eq("post_id", postId).eq("user_key", userKey)
      } else if (currentReaction !== null) {
        // like ↔ dislike 전환: UPDATE → 트리거의 UPDATE 분기 실행
        await supabase.from("community_post_reactions")
          .update({ reaction: type }).eq("post_id", postId).eq("user_key", userKey)
      } else {
        // 새 반응: INSERT → 트리거의 INSERT 분기 실행
        await supabase.from("community_post_reactions")
          .insert({ post_id: postId, user_key: userKey, reaction: type })
      }
    }
    sync().catch(console.error)
  }, [userId])

  // ---------------------------------------------------------------------------
  // 💡 댓글 관련 도구 (DB 동기화 유지)
  // ---------------------------------------------------------------------------
  const addComment = useCallback((data: any) => {
    const safeAuthorId = data.authorId === "guest" ? null : data.authorId;

    supabase.from("community_comments").insert({ 
      post_id: data.postId,
      author_id: safeAuthorId, 
      author_nickname: data.authorNickname,
      author_emoji: data.authorEmoji,
      author_level: data.authorLevel,
      content: data.content,
      published_at: new Date().toISOString() 
    }).then(({ error }) => {
      if (error) {
        console.error("🚨 댓글 DB 저장 실패:", error.message);
        alert(`저장 실패: ${error.message}`);
      }
    });

    const target = _cachedPosts.find(p => p.id === data.postId);
    if (target) {
      const newCount = (target.commentCount || 0) + 1;
      updateCachedPost(data.postId, { commentCount: newCount });
      supabase.from("community_posts").update({ comment_count: newCount }).eq("id", data.postId).then();
    }
  }, [])

  const editComment = useCallback(async (commentId: string, content: string) => {
    await supabase.from("community_comments").update({ content }).eq("id", commentId)
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content } : c)))
  }, [])

  const deleteComment = useCallback(async (commentId: string) => {
    const targetComment = comments.find((c) => c.id === commentId)
    await supabase.from("community_comments").delete().eq("id", commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    if (targetComment) {
      const targetPost = _cachedPosts.find(p => p.id === targetComment.postId);
      if (targetPost) {
        const newCount = Math.max(0, targetPost.commentCount - 1);
        updateCachedPost(targetComment.postId, { commentCount: newCount });
        supabase.from("community_posts").update({ comment_count: newCount }).eq("id", targetComment.postId).then();
      }
    }
  }, [comments])

  const reactComment = useCallback((commentId: string, type: "like" | "dislike", currentReaction: "like" | "dislike" | null) => {
    const userKey = userId ?? getOrCreateDeviceKey()
    const isToggleOff = currentReaction === type
    const sync = async () => {
      if (isToggleOff) await supabase.from("community_comment_reactions").delete().eq("comment_id", commentId).eq("user_key", userKey)
      else await supabase.from("community_comment_reactions").upsert({ comment_id: commentId, user_key: userKey, reaction: type })
    }
    sync().catch(console.error)
  }, [userId])

  const reportComment = useCallback(async (report: any) => {
    await supabase.from("comment_reports").insert({ ...report, reported_at: new Date().toISOString() })
  }, [])

  const reportPost = useCallback(async (postId: string) => {
    await fetch("/api/community/report", { method: "POST", body: JSON.stringify({ postId }) })
  }, [])

  const getComments = useCallback((id: string) => comments.filter((c) => c.postId === id), [comments])

  const filteredPosts = useMemo(() => {
    return posts
      .filter((p: CommunityPost) => !p.isDeleted)
      .filter((p: CommunityPost) => activeCategory === "all" || p.category === activeCategory)
      .filter((p: CommunityPost) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.authorNickname.toLowerCase().includes(q)
      })
  }, [posts, activeCategory, searchQuery])

  return {
    posts, comments, isLoading, activeCategory, setActiveCategory, searchQuery, setSearchQuery, filteredPosts, getComments,
    userReactions,
    createPost, updatePost, deletePost, reactPost, addComment, editComment, deleteComment, reactComment, reportComment, reportPost, incrementViewCount, fetchPosts
  }
}