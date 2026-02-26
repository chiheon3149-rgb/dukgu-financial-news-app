import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🔐 /auth/callback — OAuth PKCE 콜백 Route Handler (안전한 로컬/운영 구분 버전)
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDesc = searchParams.get("error_description")

  // 💡 [핵심 수정] 로컬과 운영 서버의 주소를 완벽하게 분리합니다.
  const forwardedHost = request.headers.get("x-forwarded-host")
  
  // x-forwarded-host가 있다는 건 Vercel 등 운영 환경이라는 뜻입니다.
  // 로컬일 때는 origin(http://localhost:3000)을 그대로 써서 https 강제 전환을 막습니다.
  const baseUrl = forwardedHost ? `https://${forwardedHost}` : origin

  // OAuth 자체 에러 처리
  if (error) {
    const msg = encodeURIComponent(errorDesc ?? error)
    return NextResponse.redirect(`${baseUrl}/login?error=${msg}`)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("[auth/callback] 세션 교환 실패:", exchangeError.message)
      const msg = encodeURIComponent(exchangeError.message)
      return NextResponse.redirect(`${baseUrl}/login?error=${msg}`)
    }
  }

  // 성공 시 최종 홈으로 리다이렉트
  return NextResponse.redirect(`${baseUrl}/`)
}