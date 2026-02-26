"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { UserProfile, XpEvent, XpSource } from "@/types"
import { LEVEL_TABLE, getLevelMeta } from "@/lib/mock/user"
import { supabase } from "@/lib/supabase" // 👈 프로젝트 설정에 맞는 경로 확인!

// =============================================================================
// 👤 UserContext — 최종 수정 버전
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
  refreshProfile: () => Promise<void> // 👈 1. 설계도에 '새로고침' 기능 추가
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isLoadingRef = useRef(false)
  const profileRef = useRef<UserProfile | null>(null)

  // 💡 [기능 추출] 유저 정보를 불러오는 핵심 로직 (재사용을 위해 분리)
  const loadUser = useCallback(async () => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setProfile(null)
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) {
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
          avatarEmoji: profileData.avatar_emoji ?? "🐱", // 👈 2. DB(snake) -> 앱(camel) 매핑
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
      }
    } catch (e) {
      console.error("[UserContext] 유저 로딩 실패:", e)
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [])

  // 3. 외부(EditPage 등)에서 호출할 새로고침 기능
  const refreshProfile = async () => {
    await loadUser()
  }

  useEffect(() => {
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [loadUser])

  useEffect(() => { profileRef.current = profile }, [profile])

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
      const prev = profileRef.current
      if (!prev) return { newTotalXp: 0, leveledUp: false, newLevel: 1 }

      const newTotalXp = prev.totalXp + amount
      const prevLevel = getLevelMeta(prev.totalXp)
      const afterLevel = getLevelMeta(newTotalXp)

      const result: XpResult = {
        newTotalXp,
        leveledUp: afterLevel.level > prevLevel.level,
        newLevel: afterLevel.level,
      }

      setProfile((p) => {
        if (!p) return p
        const actualNewXp = p.totalXp + amount
        supabase.from("xp_events").insert({
          user_id: p.id,
          source,
          amount,
          label,
          earned_at: new Date().toISOString(),
        })
        supabase.from("profiles").update({ total_xp: actualNewXp }).eq("id", p.id)
        return { ...p, totalXp: actualNewXp }
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
        refreshProfile, // 👈 4. 기능을 하위 컴포넌트에 배포
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