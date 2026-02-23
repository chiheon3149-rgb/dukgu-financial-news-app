"use client"

import { useState, useCallback } from "react"
import type { FollowRelation } from "@/types"
import { useUser } from "@/context/user-context"

// =============================================================================
// 👥 useFollow
//
// 팔로우/팔로워 관계를 관리합니다.
// 현재: localStorage 저장 (로그인 유저 ID 기반)
// Supabase 전환 시: follows 테이블 (follower_id, following_id, followed_at)
// =============================================================================

const STORAGE_KEY = "dukgu_follows"

function loadFollows(myId: string): FollowRelation[] {
  if (typeof window === "undefined") return []
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    return (all[myId] as FollowRelation[]) ?? []
  } catch {
    return []
  }
}

function saveFollows(myId: string, data: FollowRelation[]) {
  if (typeof window === "undefined") return
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    all[myId] = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {}
}

interface UseFollowReturn {
  following: FollowRelation[]
  isFollowing: (userId: string) => boolean
  toggleFollow: (target: { id: string; nickname: string; emoji: string; level: number }) => void
}

export function useFollow(): UseFollowReturn {
  const { profile } = useUser()
  const myId = profile?.id ?? null

  const [following, setFollowing] = useState<FollowRelation[]>(() =>
    myId ? loadFollows(myId) : []
  )

  const isFollowing = useCallback(
    (userId: string) => following.some((f) => f.followingId === userId),
    [following]
  )

  const toggleFollow = useCallback(
    (target: { id: string; nickname: string; emoji: string; level: number }) => {
      if (!myId) return
      setFollowing((prev) => {
        let next: FollowRelation[]
        if (prev.some((f) => f.followingId === target.id)) {
          next = prev.filter((f) => f.followingId !== target.id)
        } else {
          next = [
            ...prev,
            {
              followerId: myId,
              followingId: target.id,
              followedAt: new Date().toISOString(),
              targetNickname: target.nickname,
              targetEmoji: target.emoji,
              targetLevel: target.level,
            },
          ]
        }
        saveFollows(myId, next)
        return next
      })
    },
    [myId]
  )

  return { following, isFollowing, toggleFollow }
}
