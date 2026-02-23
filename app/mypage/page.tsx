"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookMarked, ThumbsUp, ChevronRight, MessageSquare,
  Trophy, Pencil, Zap, Settings, LogOut, Users, Eye, EyeOff
} from "lucide-react"
import { XpLevelBadge } from "@/components/dukgu/xp-level-badge"
import { MyPageQuizBanner } from "@/components/dukgu/mypage-quiz-banner"
import { PolicyModal, type PolicyType } from "@/components/dukgu/policy-modal"
import { useUser } from "@/context/user-context"
import { useSavedArticles } from "@/hooks/use-saved-articles"
import { useFollow } from "@/hooks/use-follow"
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
  const { profile, currentLevel, nextLevel, levelProgress } = useUser()
  const { savedArticles, reactions } = useSavedArticles()
  const { following, followers } = useFollow()
  const [showLevelMap, setShowLevelMap] = useState(false)
  const [showFollowList, setShowFollowList] = useState<"following" | "followers" | null>(null)
  const [openPolicy, setOpenPolicy] = useState<PolicyType | null>(null)

  // 포트폴리오 공개 설정 (로컬 상태 — Supabase 연결 시 profiles 테이블로 이전)
  const [portfolioPublic, setPortfolioPublic] = useState(false)

  if (!profile) return null

  const likedCount = reactions.filter((r) => r.type === "like").length

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <main className="max-w-md mx-auto px-5 py-8 space-y-5">

        {/* 1. 프로필 카드 */}
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-36 h-36 rounded-full -mr-12 -mt-12 blur-2xl opacity-40 transition-all duration-1000"
            style={{
              background: currentLevel.level >= 5
                ? "radial-gradient(circle, #f59e0b, #fbbf24)"
                : "radial-gradient(circle, #10b981, #34d399)",
            }}
          />
          <div className="relative z-10 space-y-5">
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
                    currentLevel.level >= 5 ? "bg-amber-50 text-amber-600 border border-amber-200"
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

        {/* 2. 팔로우 / 팔로워 */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowFollowList(showFollowList === "following" ? null : "following")}
            className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-4 flex flex-col items-center gap-1 active:scale-95 transition-all"
          >
            <span className="text-[22px] font-black text-emerald-500">{following.length}</span>
            <span className="text-[10px] font-black text-slate-400">팔로잉</span>
          </button>
          <button
            onClick={() => setShowFollowList(showFollowList === "followers" ? null : "followers")}
            className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-4 flex flex-col items-center gap-1 active:scale-95 transition-all"
          >
            <span className="text-[22px] font-black text-slate-700">{followers.length}</span>
            <span className="text-[10px] font-black text-slate-400">팔로워</span>
          </button>
        </section>

        {/* 팔로우 목록 펼침 */}
        {showFollowList && (
          <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <p className="px-5 pt-4 pb-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {showFollowList === "following" ? "팔로잉 목록" : "팔로워 목록"}
            </p>
            <div className="divide-y divide-slate-50">
              {(showFollowList === "following" ? following : followers).map((rel) => (
                <button
                  key={rel.followerId + rel.followingId}
                  onClick={() => router.push(`/profile/${showFollowList === "following" ? rel.followingId : rel.followerId}`)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors active:scale-98"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg">
                    {rel.targetEmoji}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-black text-slate-800">{rel.targetNickname}</p>
                    <p className="text-[10px] font-bold text-slate-400">Lv.{rel.targetLevel}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                </button>
              ))}
              {(showFollowList === "following" ? following : followers).length === 0 && (
                <p className="px-5 py-6 text-[12px] font-bold text-slate-400 text-center">
                  {showFollowList === "following" ? "팔로우 중인 유저가 없습니다" : "팔로워가 없습니다"}
                </p>
              )}
            </div>
          </section>
        )}

        {/* 3. 활동 요약 */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "북마크", value: savedArticles.length, icon: "🔖" },
            { label: "좋아요",  value: likedCount,          icon: "👍" },
            { label: "총 XP",  value: `${profile.totalXp}`, icon: "⚡" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-4 flex flex-col items-center gap-1">
              <span className="text-xl">{icon}</span>
              <p className="text-[18px] font-black text-slate-800">{value}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </section>

        {/* 4. 포트폴리오 공개 설정 */}
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {portfolioPublic
              ? <Eye className="w-4 h-4 text-emerald-500" />
              : <EyeOff className="w-4 h-4 text-slate-400" />}
            <div>
              <p className="text-[13px] font-black text-slate-800">포트폴리오 공개</p>
              <p className="text-[10px] font-bold text-slate-400">
                {portfolioPublic ? "팔로워에게 공개됩니다" : "비공개 상태입니다"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPortfolioPublic((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${portfolioPublic ? "bg-emerald-500" : "bg-slate-200"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${portfolioPublic ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </section>

        {/* 5. 퀴즈 배너 */}
        <MyPageQuizBanner />

        {/* 6. 레벨 로드맵 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <button onClick={() => setShowLevelMap((v) => !v)} className="w-full flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-[14px] font-black text-slate-800">레벨 로드맵</span>
            </div>
            <span className="text-[10px] font-black text-slate-400">{showLevelMap ? "접기" : "펼쳐보기"}</span>
          </button>
          {showLevelMap && (
            <div className="px-5 pb-5 space-y-2 border-t border-slate-50">
              {LEVEL_TABLE.map((l) => {
                const isCurrent = l.level === currentLevel.level
                const isDone    = l.level < currentLevel.level
                return (
                  <div key={l.level} className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 ${isCurrent ? "bg-emerald-50 border border-emerald-100 scale-[1.02]" : "opacity-50"}`}>
                    <span className="text-xl">{l.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-black text-slate-700">Lv.{l.level} {l.title}</span>
                        {isCurrent && <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">현재</span>}
                        {isDone    && <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">달성 ✓</span>}
                      </div>
                      <p className="text-[9px] font-bold text-slate-400">{l.minXp.toLocaleString()} XP 이상</p>
                    </div>
                    {isCurrent && (
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${levelProgress}%` }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 7. 메뉴 리스트 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          <MenuRow icon={<BookMarked className="w-4 h-4" />}    label="저장한 기사"       href="/mypage/saved"              badge={savedArticles.length} color="text-blue-500" />
          <MenuRow icon={<ThumbsUp className="w-4 h-4" />}      label="내가 반응한 기사"  href="/mypage/saved?tab=reactions" badge={reactions.length}      color="text-emerald-500" />
          <MenuRow icon={<Zap className="w-4 h-4" />}           label="XP 획득 내역"     href="/mypage/saved?tab=xp"                                         color="text-amber-500" />
          <MenuRow icon={<Users className="w-4 h-4" />}         label="커뮤니티"          href="/community"                                                    color="text-purple-500" />
          <MenuRow icon={<MessageSquare className="w-4 h-4" />} label="문의하기"          href="/mypage/inquiry"                                               color="text-purple-400" />
          <MenuRow icon={<Settings className="w-4 h-4" />}      label="회원정보 수정"     href="/mypage/edit"                                                  color="text-slate-500" />
        </section>

        <button className="w-full py-3.5 flex items-center justify-center gap-2 text-slate-400 hover:text-rose-400 transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-bold">로그아웃</span>
        </button>

        {/* 약관 링크 */}
        <div className="flex items-center justify-center gap-3 pb-2">
          <button
            onClick={() => setOpenPolicy("terms")}
            className="text-[10px] font-bold text-slate-300 hover:text-slate-400 transition-colors"
          >
            이용약관
          </button>
          <span className="text-slate-200 text-[10px]">·</span>
          <button
            onClick={() => setOpenPolicy("privacy")}
            className="text-[10px] font-bold text-slate-300 hover:text-slate-400 transition-colors"
          >
            개인정보처리방침
          </button>
          <span className="text-slate-200 text-[10px]">·</span>
          <span className="text-[10px] font-bold text-slate-200">v1.0.0</span>
        </div>

      </main>

      {/* 약관 / 개인정보 팝업 */}
      {openPolicy && (
        <PolicyModal type={openPolicy} onClose={() => setOpenPolicy(null)} />
      )}
    </div>
  )
}
