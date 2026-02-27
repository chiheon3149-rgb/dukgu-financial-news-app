"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { UserProfile, XpEvent, XpSource } from "@/types"
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
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const profileRef = useRef<UserProfile | null>(null)

  const loadUser = useCallback(async () => {
    // 💡 [핵심 수정 1] 데이터를 완전히 확인하기 전까지 리다이렉트를 막기 위해 로딩을 true로 고정합니다.
    setIsLoading(true) 

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setAuthUser(null)
        setProfile(null)
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle() 

      // 💡 [핵심 수정 2] 프로필 정보 유무가 확실해진 시점에 authUser를 세팅합니다.
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
          is_admin: profileData.is_admin ?? false, // 👈 💡 [추가] DB에서 완장 정보 가져오기!
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
      // 💡 [핵심 수정 3] authUser와 profile 세팅이 완전히 끝난 후 로딩을 해제합니다.
      // 이제 안전하게 아래의 useEffect(리다이렉트 가드)가 작동합니다.
      setIsLoading(false)
    }
  }, [])

  const refreshProfile = async () => {
    await loadUser()
  }

  useEffect(() => {
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUser])

  useEffect(() => {
    if (!isLoading) {
      const path = window.location.pathname;
      
      if (authUser && !profile) {
        if (path !== '/onboarding' && !path.startsWith('/auth')) {
          window.location.href = '/onboarding';
        }
      } 
      else if (authUser && profile && path === '/onboarding') {
        window.location.href = '/';
      }
    }
  }, [isLoading, authUser, profile]);

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