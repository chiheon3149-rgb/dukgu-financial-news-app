"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 🔐 로그인 페이지
// 구글 / 카카오 소셜 로그인만 지원합니다.
//
// 로고 교체 방법:
//   1. public/logo.png (또는 .svg) 파일을 추가하세요.
//   2. LOGO_PATH 상수를 해당 경로로 변경하세요.
//   3. USE_IMAGE_LOGO를 true로 바꾸면 이미지 로고가 활성화됩니다.
// =============================================================================

const USE_IMAGE_LOGO = false  // 로고 이미지 준비되면 true로 변경
const LOGO_PATH = "/logo.png" // public/ 폴더 기준 경로

export default function LoginPage() {
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err) setLoginError(decodeURIComponent(err))
  }, [])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-6">

      {/* 로고 영역 — 이미지 준비 시 USE_IMAGE_LOGO를 true로 변경 */}
      <div className="mb-10 text-center">
        {USE_IMAGE_LOGO ? (
          <div className="flex justify-center mb-3">
            <Image
              src={LOGO_PATH}
              alt="DUKGU 로고"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <div className="w-24 h-24 rounded-[28px] bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center shadow-sm">
              <span className="text-5xl select-none">🐱</span>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1.5">
          덕구와 함께하는<br/>금융 뉴스 브리핑
        </h1>
        <p className="text-sm font-medium text-slate-500">
          매일 아침, 당신을 위한 금융 뉴스 브리핑
        </p>
      </div>

      {/* 에러 메시지 */}
      {loginError && (
        <div className="w-full max-w-sm mb-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl">
          <p className="text-[12px] font-bold text-rose-500 text-center">{loginError}</p>
        </div>
      )}

      {/* 로그인 버튼 */}
      <div className="w-full max-w-sm space-y-3">

        {/* 구글 로그인 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl py-4 px-5 shadow-sm hover:shadow-md hover:border-slate-300 active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-[15px] font-black text-slate-700">구글로 시작하기</span>
        </button>

        {/* 카카오 로그인 */}
        <button
          onClick={handleKakaoLogin}
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] border border-[#FEE500] rounded-2xl py-4 px-5 shadow-sm hover:brightness-95 active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#3C1E1E" d="M12 3C6.477 3 2 6.477 2 10.5c0 2.542 1.467 4.778 3.687 6.18L4.5 21l4.664-2.53A11.3 11.3 0 0012 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
          </svg>
          <span className="text-[15px] font-black text-[#3C1E1E]">카카오로 시작하기</span>
        </button>

      </div>

      <p className="mt-8 text-[11px] font-medium text-slate-400 text-center leading-relaxed">
        로그인 시 덕구의 서비스 이용약관 및<br/>개인정보 처리방침에 동의하게 됩니다.
      </p>

    </div>
  )
}
