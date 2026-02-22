"use client"

import { createContext, useContext, useState, useCallback, useMemo } from "react"
import type { UserProfile, XpEvent, XpSource } from "@/types"
import { MOCK_USER, LEVEL_TABLE, getLevelMeta } from "@/lib/mock/user"

// =============================================================================
// 👤 UserContext — 유저 정보 전역 상태
//
// 이 파일을 만든 이유:
//   useUserProfile을 여러 컴포넌트에서 각각 호출하면
//   컴포넌트마다 "각자의 유저 정보"를 따로 들고 있게 됩니다.
//   그래서 마이페이지에서 아바타를 바꿔도 헤더가 안 바뀌는 버그가 생겼어요.
//
//   이 Context를 쓰면 앱 전체가 "하나의 유저 정보"를 공유합니다.
//   마이페이지에서 바꾸면 헤더도 즉시 반영돼요 ✅
//
// 🔄 Supabase 전환 시:
//   MOCK_USER 초기값을 supabase.auth.getUser() 결과로 교체하면 됩니다.
// =============================================================================

export interface XpResult {
  newTotalXp: number
  leveledUp: boolean
  newLevel: number
}

interface UserContextValue {
  profile: UserProfile | null
  currentLevel: ReturnType<typeof getLevelMeta>
  nextLevel: ReturnType<typeof getLevelMeta> | null
  levelProgress: number
  isLoading: boolean
  addXp: (source: XpSource, amount: number, label: string) => XpResult
  updateNickname: (nickname: string) => void
  updateAvatar: (emoji: string) => void
}

const UserContext = createContext<UserContextValue | null>(null)

// ─── Provider: app/layout.tsx에 감싸주면 됩니다 ───────────────────────────
export function UserProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <UserContext.Provider
      value={{
        profile,
        currentLevel,
        nextLevel,
        levelProgress,
        isLoading,
        addXp,
        updateNickname,
        updateAvatar,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// ─── Hook: 컴포넌트에서 useUser()로 호출하면 됩니다 ──────────────────────
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser는 UserProvider 안에서만 사용할 수 있습니다.")
  return ctx
}
