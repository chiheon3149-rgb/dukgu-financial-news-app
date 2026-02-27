"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookMarked, ThumbsUp, ChevronRight, ChevronDown,
  Trophy, Pencil, Zap, Settings, LogOut, Users,
  Eye, EyeOff, MessageSquare, HelpCircle, UserX, AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
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

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [leaveReason, setLeaveReason] = useState<string>("")
  const [leaveDetail, setLeaveDetail] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const REASON_OPTIONS = [
    "사용 빈도가 낮아서",
    "원하는 정보가 부족해서",
    "앱 사용이 불편해서",
    "기타 (직접 입력)"
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast("다음에 또 보냥! 🐾", { description: "안전하게 로그아웃 되었다냥." })
    router.push("/")
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      if (leaveReason) {
        await supabase.from("leave_reasons").insert({
          reason: leaveReason,
          detail: leaveReason === "기타 (직접 입력)" ? leaveDetail : null
        })
      }
      const { error } = await supabase.rpc("delete_user")
      if (error) throw error

      await supabase.auth.signOut()
      setShowDeleteModal(false)
      toast.success("탈퇴 처리가 완료되었다냥. 😿")
      router.push("/")
    } catch (error) {
      console.error("탈퇴 에러:", error)
      toast.error("다시 시도해 달라냥!")
      setIsDeleting(false)
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-dvh bg-slate-50 pb-32"> {/* 💡 하단 여백 넉넉히 추가 */}
      <main className="max-w-md mx-auto px-5 py-8 space-y-4">

        {/* 1. 프로필 & 레벨 (기존 유지) */}
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full -mr-12 -mt-12 blur-2xl opacity-40" style={{ background: currentLevel.level >= 5 ? "radial-gradient(circle, #f59e0b, #fbbf24)" : "radial-gradient(circle, #10b981, #34d399)" }} />
          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center text-4xl border-2 ${currentLevel.level >= 5 ? "border-amber-300 bg-amber-50" : "border-emerald-100 bg-emerald-50"}`}>
                  {profile.avatarEmoji}
                </div>
                <div>
                  <p className="text-[19px] font-black text-slate-900">{profile.nickname}</p>
                  <p className="text-[12px] font-bold text-slate-400">{profile.email}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${currentLevel.level >= 5 ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                    {currentLevel.icon} {currentLevel.title}
                  </span>
                </div>
              </div>
              <Link href="/mypage/edit" className="p-2 rounded-2xl hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-400" /></Link>
            </div>
            <div className="border-t border-slate-50 pt-3">
              <XpLevelBadge currentLevel={currentLevel} nextLevel={nextLevel} totalXp={profile.totalXp} progress={levelProgress} size="lg" />
            </div>
          </div>
        </section>

        {/* 2. 공개 설정 (기존 유지) */}
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile.portfolioPublic ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <div><p className="text-[13px] font-black text-slate-800">포트폴리오 공개</p><p className="text-[10px] font-bold text-slate-400">{profile.portfolioPublic ? "팔로워에게 공개됩니다" : "비공개 상태입니다"}</p></div>
          </div>
          <button onClick={() => updatePortfolioPublic(!profile.portfolioPublic)} className={`relative w-12 h-6 rounded-full transition-all ${profile.portfolioPublic ? "bg-emerald-500" : "bg-slate-200"}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${profile.portfolioPublic ? "translate-x-6" : "translate-x-0"}`} /></button>
        </section>

        {/* 3. 메뉴 리스트 (기존 유지) */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          <MenuRow icon={<HelpCircle className="w-4 h-4" />} label="이번 주 상식 퀴즈" href="/mypage/quiz" color="text-emerald-500" />
          <MenuRow icon={<Users className="w-4 h-4" />} label="팔로잉 / 팔로워" href="/mypage/follow" badge={following.length} color="text-purple-500" />
          <MenuRow icon={<BookMarked className="w-4 h-4" />} label="저장한 기사" href="/mypage/saved" badge={savedArticles.length} color="text-blue-500" />
          <MenuRow icon={<ThumbsUp className="w-4 h-4" />} label="내가 반응한 기사" href="/mypage/saved?tab=reactions" badge={reactions.length} color="text-emerald-500" />
          <MenuRow icon={<MessageSquare className="w-4 h-4" />} label="문의하기" href="/mypage/inquiry" color="text-purple-400" />
        </section>

        {/* 💡 4. 하단 버튼 영역 - 모바일 가독성 업그레이드 */}
        <div className="pt-6 pb-2 space-y-3">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-4 rounded-2xl text-[13px] font-black text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-2"
          >
            <UserX className="w-4 h-4" /> 덕구네 식구 탈퇴하기
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl text-[13px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4 opacity-40 text-[10px] font-bold text-slate-400">
          <button onClick={() => setOpenPolicy("terms")}>이용약관</button>
          <span>·</span>
          <button onClick={() => setOpenPolicy("privacy")}>개인정보처리방침</button>
          <span>·</span>
          <span>v1.0.0</span>
        </div>
      </main>

      {/* 💡 탈퇴 모달 - 모바일 화면 최적화 (내부 스크롤 추가) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* 상단바 (모바일용 드래그 핸들 느낌) */}
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto my-3 sm:hidden" />
            
            <div className="overflow-y-auto p-6 pt-2 sm:pt-6">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-center text-slate-900 mb-2">정말 탈퇴하시겠어요?</h3>
              <p className="text-[13px] text-center text-slate-500 mb-8 break-keep leading-relaxed">
                탈퇴 시 <span className="text-red-500 font-bold">경험치, 북마크, 활동 내역</span>이 모두 사라지며 복구할 수 없습니다. 😿
              </p>

              <div className="space-y-2 mb-8">
                <p className="text-[11px] font-black text-slate-400 mb-3 ml-1">탈퇴 사유를 알려주세요 (선택)</p>
                {REASON_OPTIONS.map((reason) => (
                  <button 
                    key={reason}
                    onClick={() => setLeaveReason(reason)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                      leaveReason === reason ? "border-red-500 bg-red-50 text-red-700 font-black shadow-sm" : "border-slate-100 text-slate-600 bg-slate-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${leaveReason === reason ? "border-red-500 bg-red-500" : "border-slate-300 bg-white"}`}>
                      {leaveReason === reason && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-[14px]">{reason}</span>
                  </button>
                ))}
                
                {leaveReason === "기타 (직접 입력)" && (
                  <textarea
                    value={leaveDetail}
                    onChange={(e) => setLeaveDetail(e.target.value)}
                    placeholder="더 나은 덕구가 되기 위해 의견을 남겨주세요."
                    className="w-full mt-2 p-4 text-[14px] bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 transition-all outline-none"
                    rows={3}
                  />
                )}
              </div>

              <div className="flex gap-3 mt-4 mb-2">
                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 py-4 rounded-2xl text-[15px] font-black text-slate-500 bg-slate-100">취소</button>
                <button onClick={handleDeleteAccount} disabled={isDeleting} className="flex-1 py-4 rounded-2xl text-[15px] font-black text-white bg-red-500 shadow-lg shadow-red-100">
                  {isDeleting ? "처리 중..." : "탈퇴하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openPolicy && <PolicyModal type={openPolicy} onClose={() => setOpenPolicy(null)} />}
    </div>
  )
}