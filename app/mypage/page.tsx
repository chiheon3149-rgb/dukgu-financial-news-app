"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BookMarked, ThumbsUp, ChevronRight, MessageSquare,
  Trophy, Pencil, Zap, Settings, LogOut
} from "lucide-react"
import { XpLevelBadge } from "@/components/dukgu/xp-level-badge"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useSavedArticles } from "@/hooks/use-saved-articles"
import { LEVEL_TABLE } from "@/lib/mock/user"

// BottomNav는 layout.tsx에서 전역으로 렌더링됩니다 → 여기서 제거

function MenuRow({
  icon,
  label,
  href,
  badge,
  color = "text-slate-600",
}: {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
  color?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className={color}>{icon}</span>
        <span className="text-[14px] font-black text-slate-800">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && badge > 0 && (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
      </div>
    </Link>
  )
}

export default function MyPage() {
  const { profile, currentLevel, nextLevel, levelProgress } = useUserProfile()
  const { savedArticles, reactions } = useSavedArticles()
  const [showLevelMap, setShowLevelMap] = useState(false)

  if (!profile) return null

  const likedCount = reactions.filter((r) => r.type === "like").length

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <main className="max-w-md mx-auto px-5 py-8 space-y-5">

        {/* 1. 프로필 카드 */}
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="relative z-10 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-[20px] flex items-center justify-center text-4xl border border-emerald-100">
                  {profile.avatarEmoji}
                </div>
                <div>
                  <p className="text-[19px] font-black text-slate-900">{profile.nickname}</p>
                  <p className="text-[12px] font-bold text-slate-400">{profile.email}</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-0.5">
                    {new Date(profile.joinedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    가입
                  </p>
                </div>
              </div>
              <Link
                href="/mypage/edit"
                className="p-2 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                <Pencil className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-50">
              <XpLevelBadge
                currentLevel={currentLevel}
                nextLevel={nextLevel}
                totalXp={profile.totalXp}
                progress={levelProgress}
                size="lg"
              />
            </div>
          </div>
        </section>

        {/* 2. 활동 요약 */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "북마크", value: savedArticles.length, icon: "🔖" },
            { label: "좋아요", value: likedCount, icon: "👍" },
            { label: "총 XP", value: `${profile.totalXp}`, icon: "⚡" },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-4 flex flex-col items-center gap-1"
            >
              <span className="text-xl">{icon}</span>
              <p className="text-[18px] font-black text-slate-800">{value}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </section>

        {/* 3. 레벨 로드맵 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowLevelMap((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-[14px] font-black text-slate-800">레벨 로드맵</span>
            </div>
            <span className="text-[10px] font-black text-slate-400">
              {showLevelMap ? "접기" : "펼쳐보기"}
            </span>
          </button>
          {showLevelMap && (
            <div className="px-5 pb-5 space-y-2 border-t border-slate-50">
              {LEVEL_TABLE.map((l) => {
                const isCurrent = l.level === currentLevel.level
                const isDone = l.level < currentLevel.level
                return (
                  <div
                    key={l.level}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors ${
                      isCurrent ? "bg-emerald-50 border border-emerald-100" : "opacity-50"
                    }`}
                  >
                    <span className="text-xl">{l.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-black text-slate-700">
                          Lv.{l.level} {l.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                            현재
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            달성
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-slate-400">
                        {l.minXp.toLocaleString()} XP 이상
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 4. 메뉴 리스트 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          <MenuRow
            icon={<BookMarked className="w-4 h-4" />}
            label="저장한 기사"
            href="/mypage/saved"
            badge={savedArticles.length}
            color="text-blue-500"
          />
          <MenuRow
            icon={<ThumbsUp className="w-4 h-4" />}
            label="내가 반응한 기사"
            href="/mypage/saved?tab=reactions"
            badge={reactions.length}
            color="text-emerald-500"
          />
          <MenuRow
            icon={<Zap className="w-4 h-4" />}
            label="XP 획득 내역"
            href="/mypage/saved?tab=xp"
            color="text-amber-500"
          />
          <MenuRow
            icon={<MessageSquare className="w-4 h-4" />}
            label="문의하기"
            href="/mypage/inquiry"
            color="text-purple-500"
          />
          <MenuRow
            icon={<Settings className="w-4 h-4" />}
            label="회원정보 수정"
            href="/mypage/edit"
            color="text-slate-500"
          />
        </section>

        <button className="w-full py-3.5 flex items-center justify-center gap-2 text-slate-400 hover:text-rose-400 transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-bold">로그아웃</span>
        </button>
      </main>
    </div>
  )
}
