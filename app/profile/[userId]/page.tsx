"use client"

import { useState, useEffect, useMemo, use } from "react"
import { Lock, TrendingUp, UserPlus, UserMinus } from "lucide-react"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { useFollow } from "@/hooks/use-follow"
import { getLevelMeta } from "@/lib/mock/user"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 👤 /profile/[userId] — 상대방 공개 프로필
//
// 팔로우 중이고, 상대가 portfolioPublic: true일 때만 포트폴리오 표시
// 현재 profiles 테이블에 portfolioPublic 필드 없음 → 항상 비공개
// =============================================================================

interface ProfileRow {
  id: string
  nickname: string
  avatar_emoji: string | null
  total_xp: number | null
  joined_at: string | null
}

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const { isFollowing, toggleFollow } = useFollow()
  const [targetProfile, setTargetProfile] = useState<ProfileRow | null | undefined>(undefined)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, nickname, avatar_emoji, total_xp, joined_at")
        .eq("id", userId)
        .single()
      setTargetProfile(data ?? null)
    }
    load()
  }, [userId])

  const levelMeta = useMemo(
    () => getLevelMeta(targetProfile?.total_xp ?? 0),
    [targetProfile?.total_xp]
  )

  const following = isFollowing(userId)

  if (targetProfile === undefined) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <DetailHeader title="프로필" />
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm animate-pulse">
          불러오는 중...
        </div>
      </div>
    )
  }

  if (!targetProfile) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <DetailHeader title="프로필" />
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
          유저를 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <DetailHeader title="프로필" />

      <main className="max-w-md mx-auto px-5 py-6 space-y-5">

        {/* 프로필 카드 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[20px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-4xl">
                {targetProfile.avatar_emoji ?? "🐱"}
              </div>
              <div>
                <p className="text-[18px] font-black text-slate-900">{targetProfile.nickname}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px]">{levelMeta.icon}</span>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Lv.{levelMeta.level} {levelMeta.title}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {targetProfile.joined_at ? new Date(targetProfile.joined_at).toLocaleDateString("ko-KR") : ""} 가입
                </p>
              </div>
            </div>

            {/* 팔로우 버튼 */}
            <button
              onClick={() => toggleFollow({ id: targetProfile.id, nickname: targetProfile.nickname, emoji: targetProfile.avatar_emoji ?? "🐱", level: levelMeta.level })}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12px] font-black transition-all active:scale-95 ${
                following
                  ? "bg-slate-100 text-slate-500 border border-slate-200"
                  : "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
              }`}
            >
              {following ? (
                <><UserMinus className="w-3.5 h-3.5" /> 팔로잉</>
              ) : (
                <><UserPlus className="w-3.5 h-3.5" /> 팔로우</>
              )}
            </button>
          </div>
        </section>

        {/* 포트폴리오 섹션 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                포트폴리오
              </p>
              <div className="flex items-center gap-1 text-slate-400">
                <Lock className="w-3 h-3" />
                <span className="text-[10px] font-bold">비공개</span>
              </div>
            </div>
          </div>

          <div className="px-5 py-10 text-center text-slate-300">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[12px] font-bold">
              {!following
                ? "팔로우하면 공개 포트폴리오를 볼 수 있어요"
                : "이 유저는 포트폴리오를 비공개로 설정했습니다"}
            </p>
          </div>
        </section>

      </main>
    </div>
  )
}
