import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// =============================================================================
// 🔐 Supabase Auth 미들웨어
//
// 모든 요청마다 Supabase 세션 쿠키를 갱신합니다.
// 이 미들웨어 없이는 토큰이 만료되어도 자동으로 갱신되지 않아
// 장시간 사용 시 인증 오류가 발생할 수 있습니다.
// =============================================================================

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 쿠키 갱신 (반드시 await — 이 호출이 쿠키를 갱신함)
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    // 정적 파일 및 이미지 제외, 나머지 모든 경로에 적용
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
