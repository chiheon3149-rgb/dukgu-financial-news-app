"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { UserProfile, XpEvent, XpSource } from "@/types"
import { LEVEL_TABLE, getLevelMeta } from "@/lib/mock/user"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 👤 UserContext — 실제 Supabase Auth 연동 버전
//
// 로그인한 유저 정보를 Supabase에서 가져와서 앱 전체에 공유합니다.
// 마이페이지에서 바꾸면 헤더도 즉시 반영됩니다 ✅
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
  updatePortfolioPublic: (value: boolean) => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isLoadingRef = useRef(false)

  // 로그인한 유저 정보 불러오기
  useEffect(() => {
    const loadUser = async () => {
      // 동시 호출 방지 (onAuthStateChange가 마운트 직후 중복 호출하는 문제 차단)
      if (isLoadingRef.current) return
      isLoadingRef.current = true
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setProfile(null)
          return
        }

        // profiles 테이블에서 유저 정보 불러오기
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileData) {
          // 기존 프로필 있으면 불러오기
          const { data: xpData } = await supabase
            .from("xp_events")
            .select("*")
            .eq("user_id", user.id)
            .order("earned_at", { ascending: false })

          setProfile({
            id: user.id,
            nickname: profileData.nickname,
            email: user.email ?? "",
            joinedAt: profileData.joined_at,
            avatarEmoji: profileData.avatar_emoji ?? "🐱",
            totalXp: profileData.total_xp ?? 0,
            portfolioPublic: profileData.portfolio_public ?? false,
            xpHistory: (xpData ?? []).map((e: any) => ({
              id: e.id,
              source: e.source,
              amount: e.amount,
              label: e.label,
              earnedAt: e.earned_at,
            })),
          })
        } else {
          // 처음 로그인 — profiles 테이블에 새 유저 생성
          const nickname = user.user_metadata?.name ?? user.email?.split("@")[0] ?? "새 유저"
          const newProfile = {
            id: user.id,
            nickname,
            email: user.email ?? "",
            avatar_emoji: "🐱",
            total_xp: 0,
            joined_at: new Date().toISOString(),
          }

          await supabase.from("profiles").insert(newProfile)

          setProfile({
            id: user.id,
            nickname,
            email: user.email ?? "",
            joinedAt: newProfile.joined_at,
            avatarEmoji: "🐱",
            totalXp: 0,
            portfolioPublic: false,
            xpHistory: [],
          })
        }
      } catch (e) {
        console.error("[UserContext] 유저 로딩 실패:", e)
      } finally {
        setIsLoading(false)
        isLoadingRef.current = false
      }
    }

    loadUser()

    // 로그인/로그아웃 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [])

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

        // Supabase에도 저장
        supabase.from("xp_events").insert({
          user_id: prev.id,
          source,
          amount,
          label,
          earned_at: event.earnedAt,
        })
        supabase.from("profiles").update({ total_xp: newTotalXp }).eq("id", prev.id)

        return { ...prev, totalXp: newTotalXp, xpHistory: [event, ...prev.xpHistory] }
      })

      return result
    },
    []
  )

  // 로컬 상태만 업데이트 — 실제 Supabase 저장은 mypage/edit/page.tsx에서 처리
  const updateNickname = useCallback((nickname: string) => {
    setProfile((prev) => (prev ? { ...prev, nickname } : prev))
  }, [])

  const updateAvatar = useCallback((emoji: string) => {
    setProfile((prev) => (prev ? { ...prev, avatarEmoji: emoji } : prev))
  }, [])

  const updatePortfolioPublic = useCallback((value: boolean) => {
    setProfile((prev) => {
      if (!prev) return prev
      supabase.from("profiles").update({ portfolio_public: value }).eq("id", prev.id)
      return { ...prev, portfolioPublic: value }
    })
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
        updatePortfolioPublic,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser는 UserProvider 안에서만 사용할 수 있습니다.")
  return ctx
}
