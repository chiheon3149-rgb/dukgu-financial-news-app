"use client"

import { useState, useCallback, useMemo } from "react"
import type { FollowRelation } from "@/types"

// =============================================================================
// 👥 useFollow
//
// 팔로우/팔로워 관계를 관리합니다.
// 현재: localStorage 저장
// Supabase 전환 시: follows 테이블 (follower_id, following_id, followed_at)
// =============================================================================

const STORAGE_KEY = "dukgu_follows"
const MY_ID = "user-001" // 🔄 Supabase Auth 연결 시 실제 유저 ID로 교체

function loadFollows(): FollowRelation[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveFollows(data: FollowRelation[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

interface UseFollowReturn {
  /** 내가 팔로우 중인 목록 */
  following: FollowRelation[]
  /** 나를 팔로우 중인 목록 (Mock — 실제는 DB 쿼리) */
  followers: FollowRelation[]
  /** 특정 유저를 팔로우 중인지 확인 */
  isFollowing: (userId: string) => boolean
  /** 팔로우 토글 */
  toggleFollow: (target: { id: string; nickname: string; emoji: string; level: number }) => void
}

// Mock 팔로워 데이터 (나를 팔로우하는 사람들)
const MOCK_FOLLOWERS: FollowRelation[] = [
  { followerId: "user-003", followingId: MY_ID, followedAt: "2026-02-01T00:00:00+09:00", targetNickname: "덕구팬", targetEmoji: "🐶", targetLevel: 2 },
  { followerId: "user-005", followingId: MY_ID, followedAt: "2026-02-10T00:00:00+09:00", targetNickname: "덕구팬", targetEmoji: "🐶", targetLevel: 2 },
]

export function useFollow(): UseFollowReturn {
  const [following, setFollowing] = useState<FollowRelation[]>(loadFollows)

  const isFollowing = useCallback(
    (userId: string) => following.some((f) => f.followingId === userId),
    [following]
  )

  const toggleFollow = useCallback(
    (target: { id: string; nickname: string; emoji: string; level: number }) => {
      setFollowing((prev) => {
        let next: FollowRelation[]
        if (prev.some((f) => f.followingId === target.id)) {
          // 언팔로우
          next = prev.filter((f) => f.followingId !== target.id)
        } else {
          // 팔로우
          const newRelation: FollowRelation = {
            followerId: MY_ID,
            followingId: target.id,
            followedAt: new Date().toISOString(),
            targetNickname: target.nickname,
            targetEmoji: target.emoji,
            targetLevel: target.level,
          }
          next = [...prev, newRelation]
        }
        saveFollows(next)
        return next
      })
    },
    []
  )

  return {
    following,
    followers: MOCK_FOLLOWERS,
    isFollowing,
    toggleFollow,
  }
}
