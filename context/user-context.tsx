"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { UserProfile, XpSource } from "@/types"
import { LEVEL_TABLE, getLevelMeta } from "@/lib/mock/user"
import { supabase } from "@/lib/supabase"

export interface XpResult {
  newTotalXp: number
  leveledUp: boolean
  newLevel: number
}

interface UserContextValue {
  profile: UserProfile | null
  user: any | null 
  currentLevel: ReturnType<typeof getLevelMeta>
  nextLevel: ReturnType<typeof getLevelMeta> | null
  levelProgress: number
  isLoading: boolean
  addXp: (source: XpSource, amount: number, label: string) => XpResult
  updateNickname: (nickname: string) => void
  updateAvatar: (emoji: string) => void
  updatePortfolioPublic: (value: boolean) => void
  refreshProfile: () => Promise<void>
  // 💡 [빌드 에러 해결] 퀴즈 페이지에서 찾는 이름을 추가합니다.
  fetchProfile: () => Promise<void> 
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const profileRef = useRef<UserProfile | null>(null)

  const loadUser = useCallback(async () => {
    setIsLoading(true) 

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setAuthUser(null); setProfile(null)
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle() 

      setAuthUser(user)

      if (profileData && profileData.nickname) {
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
          is_admin: profileData.is_admin ?? false,
          xpHistory: (xpData ?? []).map((e: any) => ({
            id: e.id,
            source: e.source,
            amount: e.amount,
            label: e.label,
            earnedAt: e.earned_at,
          })),
        })
      } else {
        setProfile(null)
      }
    } catch (e) {
      console.error("[UserContext] 로딩 실패:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 💡 갱신 함수 (두 이름 모두 지원하도록 설정)
  const refreshProfile = async () => {
    await loadUser()
  }

  useEffect(() => {
    loadUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') { loadUser() }
    })
    return () => subscription.unsubscribe()
  }, [loadUser])

  useEffect(() => {
    if (!isLoading) {
      const path = window.location.pathname
      if (authUser && !profile) {
        if (path !== '/onboarding' && !path.startsWith('/auth')) {
          window.location.href = '/onboarding'
        }
      } else if (authUser && profile && path === '/onboarding') {
        window.location.href = '/'
      } else if (!authUser) {
        // 비로그인 상태에서 보호된 경로에 있을 경우 로그인으로
        const PROTECTED = ['/mypage', '/assets/stocks', '/assets/realestate', '/assets/crypto', '/assets/gold', '/assets/cash', '/assets/savings', '/assets/bonds', '/assets/history']
        if (PROTECTED.some(p => path.startsWith(p))) {
          window.location.href = `/login?next=${encodeURIComponent(path)}`
        }
      }
    }
  }, [isLoading, authUser, profile])

  useEffect(() => { profileRef.current = profile }, [profile])

  const currentLevel = useMemo(() => getLevelMeta(profile?.totalXp ?? 0), [profile?.totalXp])
  const nextLevel = useMemo(() => LEVEL_TABLE.find((l) => l.level === currentLevel.level + 1) ?? null, [currentLevel.level])
  const levelProgress = useMemo(() => {
    if (!profile) return 0
    const earned = (profile.totalXp ?? 0) - currentLevel.minXp
    const needed = currentLevel.maxXp - currentLevel.minXp
    return Math.min(Math.round((earned / needed) * 100), 100)
  }, [profile, currentLevel])

  const addXp = useCallback((source: XpSource, amount: number, label: string): XpResult => {
    const prev = profileRef.current
    if (!prev) return { newTotalXp: 0, leveledUp: false, newLevel: 1 }

    const newTotalXp = prev.totalXp + amount
    const prevLevel = getLevelMeta(prev.totalXp)
    const afterLevel = getLevelMeta(newTotalXp)

    const result = {
      newTotalXp,
      leveledUp: afterLevel.level > prevLevel.level,
      newLevel: afterLevel.level,
    }

    setProfile(p => p ? { ...p, totalXp: newTotalXp } : p)
    supabase.from("xp_events").insert({ user_id: prev.id, source, amount, label, earned_at: new Date().toISOString() })
    supabase.from("profiles").update({ total_xp: newTotalXp }).eq("id", prev.id)

    return result
  }, [])

  const updateNickname = useCallback((nickname: string) => setProfile(p => p ? { ...p, nickname } : p), [])
  const updateAvatar = useCallback((emoji: string) => setProfile(p => p ? { ...p, avatarEmoji: emoji } : p), [])
  const updatePortfolioPublic = useCallback((v: boolean) => {
    setProfile(p => {
      if (!p) return p
      supabase.from("profiles").update({ portfolio_public: v }).eq("id", p.id)
      return { ...p, portfolioPublic: v }
    })
  }, [])

  return (
    <UserContext.Provider value={{
      profile,
      user: authUser,
      currentLevel,
      nextLevel,
      levelProgress,
      isLoading,
      addXp,
      updateNickname,
      updateAvatar,
      updatePortfolioPublic,
      refreshProfile,
      // 💡 [해결] fetchProfile이라는 이름으로도 기능을 제공합니다.
      fetchProfile: refreshProfile, 
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser error")
  return ctx
}