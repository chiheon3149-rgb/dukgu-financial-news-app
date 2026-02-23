"use client"

import { useState } from "react"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/context/user-context"

const AVATAR_OPTIONS = ["🐶", "🐱", "🐻", "🦊", "🐼", "🐯", "🦁", "🐸", "🐧", "🦉", "🐺", "🦝"]

export default function EditProfilePage() {
  const { profile, updateNickname, updateAvatar } = useUser()
  const [nickname, setNickname] = useState(profile?.nickname ?? "")
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatarEmoji ?? "🐱")
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = async () => {
    if (!nickname.trim() || nickname.length > 12) return
    setIsSaving(true)
    // 🔄 Supabase 전환 시: await supabase.from('profiles').update({ nickname, avatar_emoji: selectedAvatar }).eq('id', userId)
    await new Promise((r) => setTimeout(r, 600))
    updateNickname(nickname.trim())
    updateAvatar(selectedAvatar)
    setIsSaving(false)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const isChanged = nickname !== profile?.nickname || selectedAvatar !== profile?.avatarEmoji
  const isValid = nickname.trim().length >= 2 && nickname.trim().length <= 12

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/mypage" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <span className="text-[16px] font-black text-slate-900">회원정보 수정</span>
          </div>
          <button
            onClick={handleSave}
            disabled={!isChanged || !isValid || isSaving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-black transition-all ${
              isSaved ? "bg-emerald-500 text-white"
              : isChanged && isValid ? "bg-emerald-500 text-white active:scale-95"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isSaved ? <Check className="w-3.5 h-3.5" /> : null}
            {isSaved ? "저장됨" : "저장"}
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 py-6 space-y-5">

        {/* 아바타 선택 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" /> 아바타 선택
          </h3>

          {/* 현재 선택 미리보기 */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[24px] flex items-center justify-center text-5xl border-2 border-emerald-200">
              {selectedAvatar}
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {AVATAR_OPTIONS.map((emoji) => (
              <button key={emoji} onClick={() => setSelectedAvatar(emoji)}
                className={`w-full aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all ${
                  selectedAvatar === emoji
                    ? "bg-emerald-50 border-2 border-emerald-400 scale-110"
                    : "bg-slate-50 border border-slate-100 hover:bg-slate-100 active:scale-95"
                }`}>
                {emoji}
              </button>
            ))}
          </div>
        </section>

        {/* 닉네임 변경 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" /> 닉네임 변경
          </h3>
          <div className="space-y-1.5">
            <div className={`flex items-center gap-3 px-4 py-3.5 bg-slate-50 rounded-2xl border transition-all ${
              nickname && !isValid ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-100 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-200"
            }`}>
              <input type="text" value={nickname} maxLength={12}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 입력 (2~12자)"
                className="flex-1 bg-transparent text-[15px] font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none"
              />
              <span className={`text-[10px] font-black shrink-0 ${nickname.length > 12 ? "text-rose-400" : "text-slate-400"}`}>
                {nickname.length}/12
              </span>
            </div>
            {nickname && !isValid && (
              <p className="text-[11px] font-bold text-rose-400 px-1">닉네임은 2자 이상 12자 이하로 입력해 주세요.</p>
            )}
          </div>
        </section>

        {/* 계정 정보 (읽기 전용) */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 space-y-3">
          <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-slate-300 rounded-full" /> 계정 정보
          </h3>
          {[
            { label: "이메일", value: profile?.email ?? "-" },
            { label: "가입일", value: profile ? new Date(profile.joinedAt).toLocaleDateString("ko-KR") : "-" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-[12px] font-bold text-slate-400">{label}</span>
              <span className="text-[13px] font-black text-slate-600">{value}</span>
            </div>
          ))}
        </section>

      </main>
    </div>
  )
}
