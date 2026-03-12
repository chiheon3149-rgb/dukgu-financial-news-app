"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DetailHeader } from "@/components/dukgu/detail-header"
import { AvatarPicker } from "@/components/dukgu/avatar-picker" 
import { supabase } from "@/lib/supabase"
import { useUser } from "@/context/user-context"

export default function ProfileEditPage() {
  const router = useRouter()
  const { profile, refreshProfile, isLoading: isUserLoading } = useUser()

  const [nickname, setNickname] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("🐱") // 기본값 설정
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. 데이터 로드 시 초기값 세팅 (profile이 바뀔 때마다 실행)
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || "")
      setSelectedEmoji(profile.avatarEmoji || "🐱")
    }
  }, [profile])

  // 닉네임 중복 체크
  const checkNickname = async () => {
    const trimmedName = nickname.trim()
    if (trimmedName.length < 2) {
      toast.error("닉네임은 최소 2글자 이상이어야 한다냥! 🐾")
      return
    }

    if (trimmedName === profile?.nickname) {
      setStatus("available")
      return
    }

    setStatus("checking")
    try {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("nickname")
        .eq("nickname", trimmedName)
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

  const handleUpdate = async () => {
    // 💡 방어 로직: 닉네임이 그대로거나 중복 확인을 마쳤을 때만 실행
    const isNameSame = nickname.trim() === profile?.nickname
    if (status !== "available" && !isNameSame) {
      toast.error("닉네임 중복 확인을 먼저 해달라냥! 🐾")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: nickname.trim(),
          avatar_emoji: selectedEmoji,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile?.id)

      if (error) throw error

      await refreshProfile()
      toast.success("프로필이 깔끔하게 수정되었다냥! 🐾")
      router.back()
    } catch (err) {
      toast.error("수정 실패다냥. 다시 해달라냥.")
      setIsSubmitting(false)
    }
  }

  // 닉네임 타이핑 시 상태 리셋 (내 이름이랑 똑같아지면 available로 자동 변경)
  useEffect(() => {
    if (nickname.trim() === profile?.nickname) {
      setStatus("available")
    } else {
      setStatus("idle")
    }
  }, [nickname, profile?.nickname])

  // 🚨 [핵심!] 데이터 로딩 중이거나 프로필이 없으면 로딩 화면을 보여줍니다.
  // 이 처리가 없으면 하단 렌더링에서 profile.nickname 등을 읽다가 에러가 납니다.
  if (isUserLoading || !profile) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <DetailHeader title="프로필 수정" />
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm font-bold">곳간 명부 가져오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-10">
      <DetailHeader title="프로필 수정" />

      <main className="max-w-md mx-auto px-6 py-8 space-y-6 animate-in fade-in duration-500">
        <AvatarPicker 
          selectedEmoji={selectedEmoji} 
          onSelect={setSelectedEmoji} 
        />

        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">닉네임 변경</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력해줘"
                className={`w-full bg-slate-50 border-2 rounded-2xl py-3.5 px-5 font-bold outline-none transition-all text-[14px] ${
                  status === "available" ? "border-emerald-500 bg-white" : 
                  status === "taken" ? "border-rose-500 bg-white" : "border-slate-100 focus:border-emerald-500"
                }`}
              />
              <div className="absolute right-3 top-3.5">
                {status === "checking" && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
                {status === "available" && <Check className="w-4 h-4 text-emerald-500" />}
                {status === "taken" && <AlertCircle className="w-4 h-4 text-rose-500" />}
              </div>
            </div>
            <button 
              onClick={checkNickname}
              disabled={status === "checking" || nickname.trim() === profile?.nickname}
              className="px-4 bg-slate-800 text-white rounded-2xl text-[12px] font-black active:scale-95 disabled:opacity-30"
            >
              확인
            </button>
          </div>
        </section>

        <button
          onClick={handleUpdate}
          disabled={isSubmitting || (status !== "available" && nickname.trim() !== profile?.nickname)}
          className="w-full py-4 bg-emerald-500 text-white rounded-[24px] font-black shadow-lg shadow-emerald-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-95"
        >
          {isSubmitting ? "수정 중..." : "수정 완료 🐾"}
        </button>
      </main>
    </div>
  )
}