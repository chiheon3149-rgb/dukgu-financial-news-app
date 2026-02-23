"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// =============================================================================
// 🔐 /auth/callback — OAuth 콜백 처리 (클라이언트 컴포넌트)
//
// 서버사이드 Route Handler 대신 클라이언트 컴포넌트를 사용하는 이유:
//   - createBrowserClient가 PKCE code_verifier를 쿠키에서 직접 읽어 교환 가능
//   - Implicit flow(해시 기반)와 PKCE flow(코드 기반) 모두 자동 처리
//   - 교환 실패 시 명시적 에러 UI를 보여줄 수 있음
// =============================================================================

export default function AuthCallbackPage() {
  const router = useRouter()
  const [isError, setIsError] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")
        const errorParam = params.get("error")
        const errorDesc = params.get("error_description")

        // OAuth 자체 에러 (예: 사용자가 취소)
        if (errorParam) {
          setErrorMsg(errorDesc ?? errorParam)
          setIsError(true)
          return
        }

        // PKCE flow: code를 세션으로 교환
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error("[auth/callback] 세션 교환 실패:", error.message)
            setErrorMsg(error.message)
            setIsError(true)
            return
          }
        }

        // 세션 확인 후 홈으로 이동
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.replace("/")
        } else {
          setErrorMsg("세션을 가져올 수 없습니다. 다시 시도해주세요.")
          setIsError(true)
        }
      } catch (e: any) {
        console.error("[auth/callback] 예외:", e)
        setErrorMsg(e?.message ?? "알 수 없는 오류가 발생했습니다.")
        setIsError(true)
      }
    }

    run()
  }, [router])

  if (isError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 gap-5 px-6">
        <div className="text-5xl">😿</div>
        <div className="text-center space-y-1">
          <p className="text-[15px] font-black text-slate-700">로그인에 실패했습니다</p>
          {errorMsg && (
            <p className="text-[11px] font-bold text-slate-400">{errorMsg}</p>
          )}
        </div>
        <button
          onClick={() => router.replace("/login")}
          className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[13px] font-black active:scale-95 transition-all shadow-sm shadow-emerald-200"
        >
          다시 시도하기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="text-5xl animate-pulse">🐱</div>
        <div className="space-y-1">
          <p className="text-[14px] font-black text-slate-600">로그인 확인 중...</p>
          <p className="text-[11px] font-bold text-slate-400">잠시만 기다려주세요</p>
        </div>
      </div>
    </div>
  )
}
