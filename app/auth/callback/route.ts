import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🔐 /auth/callback
// 구글/카카오 로그인 후 Supabase가 이 주소로 리디렉션합니다.
// 세션을 쿠키에 저장하고 홈으로 이동합니다.
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // 리다이렉트 응답을 먼저 생성 — 이 객체에 쿠키를 직접 붙여야 함
  const response = NextResponse.redirect(`${origin}/`)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // response 객체에 직접 쿠키 설정 — 리다이렉트와 함께 브라우저에 전달됨
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return response
}
