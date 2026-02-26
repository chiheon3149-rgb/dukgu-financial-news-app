"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AvatarPicker } from "@/components/dukgu/avatar-picker"
import { supabase } from "@/lib/supabase" // 👈 경로가 맞는지 꼭 확인해달라냥!
import { useUser } from "@/context/user-context"

export default function OnboardingPage() {
  const router = useRouter()
  const { profile, refreshProfile, isLoading: isUserLoading } = useUser()

  const [nickname, setNickname] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("🐱")
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. 닉네임 중복 체크
  const checkNickname = async () => {
    if (nickname.trim().length < 2) {
      toast.error("이름은 최소 2글자 이상이어야 한다냥! 🐾")
      return
    }

    setStatus("checking")
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("nickname", nickname.trim())
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        setStatus("taken")
        toast.error("이미 누가 쓰고 있는 이름이다냥! 😿")
      } else {
        setStatus("available")
        toast.success("사용 가능한 이름이다냥! ✨")
      }
    } catch (err) {
      setStatus("idle")
      toast.error("중복 확인 중 오류가 발생했다냥.")
    }
  }

  // 2. 프로필 최종 저장 및 입장
  const handleSubmit = async () => {
    if (status !== "available" || !profile?.id) return
    
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: nickname.trim(),
          avatar_emoji: selectedEmoji, // 👈 DB 컬럼명(snake)에 맞춰 저장
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      // 💡 [핵심] Context 정보를 최신화하여 'proxy.ts'의 검문을 무사통과하게 함
      await refreshProfile() 
      
      toast.success("이제 덕구네 식구가 되었다냥! 환영한다냥! 🐾")
      router.replace("/") // 메인으로 입장!
    } catch (err) {
      toast.error("입장 등록에 실패했다냥. 다시 시도해달라냥.")
      setIsSubmitting(false)
    }
  }

  // 입력값이 바뀌면 중복 확인 상태 리셋
  useEffect(() => {
    setStatus("idle")
  }, [nickname])

  // 🚨 [에러 방지] 유저 정보를 불러오는 중이라면 로딩 화면을 보여줌
  if (isUserLoading) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-10">
      <DetailHeader title="식구 등록" showBack={false} />

      <main className="max-w-md mx-auto px-6 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="text-center space-y-3">
          <div className="inline-flex p-3 bg-emerald-100 rounded-2xl mb-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">반갑다냥! 이름이 뭐냥?</h1>
          <p className="text-slate-400 font-medium text-[14px] leading-relaxed">
            곳간에서 활동하려면 나만의 닉네임과<br />캐릭터를 정해야 한다냥.
          </p>
        </section>

        <AvatarPicker 
          selectedEmoji={selectedEmoji} 
          onSelect={setSelectedEmoji} 
        />

        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">닉네임 설정</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="2~10자 이내"
                maxLength={10}
                className={`w-full bg-slate-50 border-2 rounded-2xl py-3.5 px-5 font-bold outline-none transition-all text-[15px] ${
                  status === "available" ? "border-emerald-500 bg-white" : 
                  status === "taken" ? "border-rose-500 bg-white" : "border-slate-100 focus:border-emerald-500"
                }`}
              />
              <div className="absolute right-4 top-4">
                {status === "checking" && <Loader2 className="w-5 h-5 animate-spin text-slate-300" />}
                {status === "available" && <Check className="w-5 h-5 text-emerald-500" />}
                {status === "taken" && <AlertCircle className="w-5 h-5 text-rose-500" />}
              </div>
            </div>
            <button
              onClick={checkNickname}
              disabled={status === "checking" || nickname.length < 2}
              className="px-5 bg-slate-800 text-white rounded-2xl text-[13px] font-black active:scale-95 disabled:opacity-30 transition-all"
            >
              확인
            </button>
          </div>
        </section>

        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={status !== "available" || isSubmitting}
            className="w-full py-4.5 bg-emerald-500 text-white rounded-[24px] font-black text-lg shadow-lg shadow-emerald-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-95"
          >
            {isSubmitting ? "곳간 문 여는 중..." : "덕구 식구 되기 🐾"}
          </button>
          <p className="text-center text-[11px] text-slate-300 mt-4 font-bold">
            언제든지 마이페이지에서 수정할 수 있다냥!
          </p>
        </div>
      </main>
    </div>
  )
}