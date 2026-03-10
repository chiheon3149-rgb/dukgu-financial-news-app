"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Mail, Lock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isEmailVisible, setIsEmailVisible] = useState(false)
  const [isKakaoInApp, setIsKakaoInApp] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err) setLoginError(decodeURIComponent(err))

    setIsKakaoInApp(/KAKAOTALK/i.test(navigator.userAgent))
  }, [])

  const handleGoogleLogin = async () => {
    if (isKakaoInApp) {
      const cleanUrl = `${window.location.origin}${window.location.pathname}`
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(cleanUrl)}`

      setTimeout(() => {
        setLoginError("외부 브라우저(크롬/사파리)에서 구글 로그인을 이용해주세요")
      }, 2000)
      return
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = emailRef.current?.value
    const password = passwordRef.current?.value

    if (!email || !password) return

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoginError("로그인 정보가 올바르지 않다냥! 🐾")
    } else {
      router.push("/")
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-6">
      
      {/* 로고 영역 */}
      <div className="mb-10 text-center">
        <div className="flex justify-center mb-3">
          {/* 💡 [수정 2] 배경색(bg-emerald-50)과 테두리(border)를 없애고 이미지만 깔끔하게 보여주도록 껍데기를 수정했습니다. */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* 💡 [수정 3] 이모지 대신 Image 태그를 넣습니다. src 경로에 주의하세요! 모서리 곡률(rounded-2xl) 추가됨 */}
            <Image 
              src="/apple-icon.png" 
              alt="덕구 로고" 
              width={96} 
              height={96} 
              className="object-contain drop-shadow-sm rounded-2xl"
              priority
            />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1.5">
          덕구와 함께하는<br/>금융 뉴스 브리핑
        </h1>
        <p className="text-sm font-medium text-slate-500">매일 아침, 당신을 위한 금융 뉴스 브리핑</p>
      </div>

      {/* 에러 메시지 */}
      {loginError && (
        <div className="w-full max-w-sm mb-4 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl animate-bounce">
          <p className="text-[12px] font-bold text-rose-500 text-center">{loginError}</p>
        </div>
      )}

      {/* 로그인 버튼 그룹 */}
      <div className="w-full max-w-sm space-y-3">
        <button onClick={handleKakaoLogin} className="w-full flex items-center justify-center gap-3 bg-[#FEE500] border border-[#FEE500] rounded-2xl py-4 px-5 shadow-sm hover:brightness-95 active:scale-95 transition-all">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#3C1E1E" d="M12 3C6.477 3 2 6.477 2 10.5c0 2.542 1.467 4.778 3.687 6.18L4.5 21l4.664-2.53A11.3 11.3 0 0012 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/></svg>
          <span className="text-[15px] font-black text-[#3C1E1E]">카카오로 시작하기</span>
        </button>

        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl py-4 px-5 shadow-sm hover:shadow-md active:scale-95 transition-all">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          <span className="text-[15px] font-black text-slate-700">구글로 시작하기</span>
        </button>

        {/* 이메일 로그인 버튼 */}
        {!isEmailVisible ? (
          <button 
            onClick={() => setIsEmailVisible(true)}
            className="w-full py-3 text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            다른 방법으로 로그인하기
          </button>
        ) : (
          <div className="w-full pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <form onSubmit={handleEmailLogin} className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                <input 
                  ref={emailRef}
                  type="email" 
                  name="email"
                  placeholder="Email ID" 
                  className="w-full text-[13px] py-3 pl-10 pr-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-300 transition-all font-medium"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                <input 
                  ref={passwordRef}
                  type="password" 
                  name="password"
                  placeholder="Password" 
                  className="w-full text-[13px] py-3 pl-10 pr-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-300 transition-all font-medium"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-[13px] font-black shadow-sm active:scale-95 transition-all"
              >
                이메일로 로그인
              </button>
            </form>
          </div>
        )}
      </div>

      <p className="mt-8 text-[11px] font-medium text-slate-400 text-center leading-relaxed">
        로그인 시 덕구의{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-slate-600 transition-colors">
          서비스 이용약관
        </Link>{" "}
        및{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-600 transition-colors">
          개인정보처리방침
        </Link>
        에 동의하게 됩니다.
      </p>

      {/* 하단 고정 약관 링크 */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4">
        <Link href="/terms" className="text-[10px] font-medium text-slate-300 hover:text-slate-500 transition-colors">
          이용약관
        </Link>
        <span className="text-[10px] text-slate-200">|</span>
        <Link href="/privacy" className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
          개인정보처리방침
        </Link>
      </div>

    </div>
  )
}