"use client"

import { useState, useCallback, useEffect } from "react"
import type { FollowRelation } from "@/types"
import { useUser } from "@/context/user-context"
import { supabase } from "@/lib/supabase"
import { getLevelMeta } from "@/lib/mock/user"

// =============================================================================
// 👥 useFollow
//
// 팔로우/팔로워 관계를 Supabase follows 테이블로 관리합니다.
// follows (follower_id, following_id, followed_at)
// =============================================================================

interface UseFollowReturn {
  following: FollowRelation[]
  followers: FollowRelation[]
  isFollowing: (userId: string) => boolean
  toggleFollow: (target: { id: string; nickname: string; emoji: string; level: number }) => void
}

export function useFollow(): UseFollowReturn {
  const { profile } = useUser()
  const myId = profile?.id ?? null

  const [following, setFollowing] = useState<FollowRelation[]>([])
  const [followers, setFollowers] = useState<FollowRelation[]>([])

  useEffect(() => {
    if (!myId) {
      setFollowing([])
      setFollowers([])
      return
    }

    // 내가 팔로우하는 사람들
    supabase
      .from("follows")
      .select("following_id, followed_at")
      .eq("follower_id", myId)
      .then(async ({ data: followRows }) => {
        if (!followRows?.length) { setFollowing([]); return }
        const ids = followRows.map(r => r.following_id)
        const { data: profileRows } = await supabase
          .from("profiles_public")
          .select("id, nickname, avatar_emoji, total_xp")
          .in("id", ids)
        const profileMap = Object.fromEntries((profileRows ?? []).map(p => [p.id, p]))
        setFollowing(followRows.map(r => {
          const p = profileMap[r.following_id]
          return {
            followerId: myId,
            followingId: r.following_id,
            followedAt: r.followed_at,
            targetNickname: p?.nickname ?? "알 수 없음",
            targetEmoji: p?.avatar_emoji ?? "🐱",
            targetLevel: getLevelMeta(p?.total_xp ?? 0).level,
          }
        }))
      })

    // 나를 팔로우하는 사람들
    supabase
      .from("follows")
      .select("follower_id, followed_at")
      .eq("following_id", myId)
      .then(async ({ data: followRows }) => {
        if (!followRows?.length) { setFollowers([]); return }
        const ids = followRows.map(r => r.follower_id)
        const { data: profileRows } = await supabase
          .from("profiles_public")
          .select("id, nickname, avatar_emoji, total_xp")
          .in("id", ids)
        const profileMap = Object.fromEntries((profileRows ?? []).map(p => [p.id, p]))
        setFollowers(followRows.map(r => {
          const p = profileMap[r.follower_id]
          return {
            followerId: r.follower_id,
            followingId: myId,
            followedAt: r.followed_at,
            targetNickname: p?.nickname ?? "알 수 없음",
            targetEmoji: p?.avatar_emoji ?? "🐱",
            targetLevel: getLevelMeta(p?.total_xp ?? 0).level,
          }
        }))
      })
  }, [myId])

  const isFollowing = useCallback(
    (userId: string) => following.some((f) => f.followingId === userId),
    [following]
  )

  const toggleFollow = useCallback(
    (target: { id: string; nickname: string; emoji: string; level: number }) => {
      if (!myId) return
      if (myId === target.id) return  // 자기 자신 팔로우 방지
      const alreadyFollowing = following.some(f => f.followingId === target.id)

      if (alreadyFollowing) {
        setFollowing(prev => prev.filter(f => f.followingId !== target.id))
        supabase.from("follows").delete().eq("follower_id", myId).eq("following_id", target.id).then()
      } else {
        const newRelation: FollowRelation = {
          followerId: myId,
          followingId: target.id,
          followedAt: new Date().toISOString(),
          targetNickname: target.nickname,
          targetEmoji: target.emoji,
          targetLevel: target.level,
        }
        setFollowing(prev => [...prev, newRelation])
        supabase.from("follows").insert({ follower_id: myId, following_id: target.id }).then()
      }
    },
    [myId, following]
  )

  return { following, followers, isFollowing, toggleFollow }
}
