import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🔐 /auth/callback — OAuth PKCE 콜백 Route Handler (서버)
//
// 서버사이드로 처리하는 이유:
//   - createServerClient가 request.cookies에서 PKCE code_verifier를 직접 읽어
//     code ↔ session 교환이 안정적으로 동작합니다.
//   - 클라이언트 컴포넌트에서는 HttpOnly 쿠키를 읽지 못해 verifier를 찾지 못할 수 있습니다.
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDesc = searchParams.get("error_description")

  // Vercel 등 프록시 환경에서 실제 도메인 파악
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https"
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin

  // OAuth 자체 에러 (예: 사용자가 취소)
  if (error) {
    const msg = encodeURIComponent(errorDesc ?? error)
    return NextResponse.redirect(`${baseUrl}/login?error=${msg}`)
  }

  // PKCE code → session 교환
  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
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

  return NextResponse.redirect(`${baseUrl}/`)
}
