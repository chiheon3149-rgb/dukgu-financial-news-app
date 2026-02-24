"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookMarked, ThumbsUp, ChevronRight, ChevronDown,
  Trophy, Pencil, Zap, Settings, LogOut, Users,
  Eye, EyeOff, MessageSquare, HelpCircle,
} from "lucide-react"
import { XpLevelBadge } from "@/components/dukgu/xp-level-badge"
import { PolicyModal, type PolicyType } from "@/components/dukgu/policy-modal"
import { useUser } from "@/context/user-context"
import { useSavedArticles } from "@/hooks/use-saved-articles"
import { useFollow } from "@/hooks/use-follow"
import { supabase } from "@/lib/supabase"
import { LEVEL_TABLE } from "@/lib/mock/user"

function MenuRow({
  icon, label, href, badge, color = "text-slate-600",
}: {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
  color?: string
}) {
  return (
    <Link href={href} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group">
      <div className="flex items-center gap-3">
        <span className={color}>{icon}</span>
        <span className="text-[14px] font-black text-slate-800">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && badge > 0 && (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{badge}</span>
        )}
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
      </div>
    </Link>
  )
}

export default function MyPage() {
  const router = useRouter()
  const { profile, currentLevel, nextLevel, levelProgress, updatePortfolioPublic } = useUser()
  const { savedArticles, reactions } = useSavedArticles()
  const { following } = useFollow()
  const [showLevelMap, setShowLevelMap] = useState(false)
  const [openPolicy, setOpenPolicy] = useState<PolicyType | null>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (!profile) return null

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <main className="max-w-md mx-auto px-5 py-8 space-y-4">

        {/* 1. 프로필 카드 + 레벨 로드맵 아코디언 */}
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-36 h-36 rounded-full -mr-12 -mt-12 blur-2xl opacity-40 transition-all duration-1000"
            style={{
              background: currentLevel.level >= 5
                ? "radial-gradient(circle, #f59e0b, #fbbf24)"
                : "radial-gradient(circle, #10b981, #34d399)",
            }}
          />
          <div className="relative z-10 space-y-4">
            {/* 아바타 + 닉네임 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center text-4xl border-2 transition-all duration-500 ${
                  currentLevel.level >= 5 ? "border-amber-300 bg-amber-50" : "border-emerald-100 bg-emerald-50"
                }`}>
                  {profile.avatarEmoji}
                </div>
                <div>
                  <p className="text-[19px] font-black text-slate-900">{profile.nickname}</p>
                  <p className="text-[12px] font-bold text-slate-400">{profile.email}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${
                    currentLevel.level >= 5
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  }`}>
                    {currentLevel.icon} {currentLevel.title}
                  </span>
                </div>
              </div>
              <Link href="/mypage/edit" className="p-2 rounded-2xl hover:bg-slate-100 transition-colors">
                <Pencil className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* XP 게이지 */}
            <div className="border-t border-slate-50 pt-3">
              <XpLevelBadge
                currentLevel={currentLevel}
                nextLevel={nextLevel}
                totalXp={profile.totalXp}
                progress={levelProgress}
                size="lg"
              />
            </div>

            {/* 레벨 로드맵 아코디언 */}
            <div className="border-t border-slate-50 pt-3">
              <button
                onClick={() => setShowLevelMap((v) => !v)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[12px] font-black text-slate-600">레벨 로드맵</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showLevelMap ? "rotate-180" : ""}`} />
              </button>
              {showLevelMap && (
                <div className="mt-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  {LEVEL_TABLE.map((l) => {
                    const isCurrent = l.level === currentLevel.level
                    const isDone    = l.level < currentLevel.level
                    return (
                      <div key={l.level} className={`flex items-center gap-3 px-3 py-2 rounded-2xl transition-all ${
                        isCurrent ? "bg-emerald-50 border border-emerald-100" : "opacity-50"
                      }`}>
                        <span className="text-lg">{l.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-700">Lv.{l.level} {l.title}</span>
                            {isCurrent && <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">현재</span>}
                            {isDone    && <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">달성 ✓</span>}
                          </div>
                          <p className="text-[9px] font-bold text-slate-400">{l.minXp.toLocaleString()} XP 이상</p>
                        </div>
                        {isCurrent && (
                          <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${levelProgress}%` }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. 포트폴리오 공개 설정 */}
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile.portfolioPublic
              ? <Eye className="w-4 h-4 text-emerald-500" />
              : <EyeOff className="w-4 h-4 text-slate-400" />}
            <div>
              <p className="text-[13px] font-black text-slate-800">포트폴리오 공개</p>
              <p className="text-[10px] font-bold text-slate-400">
                {profile.portfolioPublic ? "팔로워에게 공개됩니다" : "비공개 상태입니다"}
              </p>
            </div>
          </div>
          <button
            onClick={() => updatePortfolioPublic(!profile.portfolioPublic)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${profile.portfolioPublic ? "bg-emerald-500" : "bg-slate-200"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${profile.portfolioPublic ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </section>

        {/* 3. 메뉴 리스트 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          <MenuRow icon={<HelpCircle className="w-4 h-4" />}    label="이번 주 상식 퀴즈"   href="/mypage/quiz"                color="text-emerald-500" />
          <MenuRow icon={<Users className="w-4 h-4" />}         label="팔로잉 / 팔로워"      href="/mypage/follow"             badge={following.length}      color="text-purple-500" />
          <MenuRow icon={<BookMarked className="w-4 h-4" />}    label="저장한 기사"           href="/mypage/saved"             badge={savedArticles.length}  color="text-blue-500" />
          <MenuRow icon={<ThumbsUp className="w-4 h-4" />}      label="내가 반응한 기사"      href="/mypage/saved?tab=reactions" badge={reactions.length}    color="text-emerald-500" />
          <MenuRow icon={<Zap className="w-4 h-4" />}           label="XP 획득 내역"          href="/mypage/saved?tab=xp"                                    color="text-amber-500" />
          <MenuRow icon={<MessageSquare className="w-4 h-4" />} label="문의하기"              href="/mypage/inquiry"                                          color="text-purple-400" />
          <MenuRow icon={<Settings className="w-4 h-4" />}      label="회원정보 수정"         href="/mypage/edit"                                            color="text-slate-500" />
        </section>

        <button
          onClick={handleLogout}
          className="w-full py-3.5 flex items-center justify-center gap-2 text-slate-400 hover:text-rose-400 transition-colors active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-bold">로그아웃</span>
        </button>

        <div className="flex items-center justify-center gap-3 pb-2">
          <button onClick={() => setOpenPolicy("terms")} className="text-[10px] font-bold text-slate-300 hover:text-slate-400 transition-colors">
            이용약관
          </button>
          <span className="text-slate-200 text-[10px]">·</span>
          <button onClick={() => setOpenPolicy("privacy")} className="text-[10px] font-bold text-slate-300 hover:text-slate-400 transition-colors">
            개인정보처리방침
          </button>
          <span className="text-slate-200 text-[10px]">·</span>
          <span className="text-[10px] font-bold text-slate-200">v1.0.0</span>
        </div>

      </main>

      {openPolicy && (
        <PolicyModal type={openPolicy} onClose={() => setOpenPolicy(null)} />
      )}
    </div>
  )
}
