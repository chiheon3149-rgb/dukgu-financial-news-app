"use client"

import { useState, useCallback, useMemo } from "react"
import type { UserProfile, XpEvent, XpSource } from "@/types"
import { MOCK_USER, LEVEL_TABLE, getLevelMeta } from "@/lib/mock/user"

export interface XpResult {
  newTotalXp: number
  leveledUp: boolean
  newLevel: number
}

interface UseUserProfileReturn {
  profile: UserProfile | null
  currentLevel: ReturnType<typeof getLevelMeta>
  nextLevel: ReturnType<typeof getLevelMeta> | null
  levelProgress: number
  addXp: (source: XpSource, amount: number, label: string) => XpResult
  updateNickname: (nickname: string) => void
  updateAvatar: (emoji: string) => void
  isLoading: boolean
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(MOCK_USER)
  const [isLoading] = useState(false)

  const currentLevel = useMemo(
    () => getLevelMeta(profile?.totalXp ?? 0),
    [profile?.totalXp]
  )

  const nextLevel = useMemo(() => {
    return LEVEL_TABLE.find((l) => l.level === currentLevel.level + 1) ?? null
  }, [currentLevel.level])

  const levelProgress = useMemo(() => {
    if (!profile) return 0
    const earned = profile.totalXp - currentLevel.minXp
    const needed = currentLevel.maxXp - currentLevel.minXp
    return Math.min(Math.round((earned / needed) * 100), 100)
  }, [profile, currentLevel])

  // 클로저 이슈 해결: setProfile의 함수형 업데이트를 사용해
  // 최신 state를 참조합니다. 반환값은 ref에 저장해서 꺼냅니다.
  const addXp = useCallback(
    (source: XpSource, amount: number, label: string): XpResult => {
      let result: XpResult = { newTotalXp: 0, leveledUp: false, newLevel: 1 }

      setProfile((prev) => {
        if (!prev) return prev
        const newTotalXp = prev.totalXp + amount
        const prevLevel = getLevelMeta(prev.totalXp)
        const afterLevel = getLevelMeta(newTotalXp)

        result = {
          newTotalXp,
          leveledUp: afterLevel.level > prevLevel.level,
          newLevel: afterLevel.level,
        }

        const event: XpEvent = {
          id: `xp-${Date.now()}`,
          source,
          amount,
          label,
          earnedAt: new Date().toISOString(),
        }
        return { ...prev, totalXp: newTotalXp, xpHistory: [event, ...prev.xpHistory] }
      })

      return result
    },
    []
  )

  const updateNickname = useCallback((nickname: string) => {
    setProfile((prev) => (prev ? { ...prev, nickname } : prev))
  }, [])

  const updateAvatar = useCallback((emoji: string) => {
    setProfile((prev) => (prev ? { ...prev, avatarEmoji: emoji } : prev))
  }, [])

  return {
    profile,
    currentLevel,
    nextLevel,
    levelProgress,
    addXp,
    updateNickname,
    updateAvatar,
    isLoading,
  }
}
