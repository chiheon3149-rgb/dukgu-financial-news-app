import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🛡️ proxy.ts — 접근 제어 (1depth 허용, 2depth/Profile 차단, 공지사항 완전 개방)
// =============================================================================

/** * 💡 1. '정확히' 이 주소일 때만 비로그인 통과 (1depth 메뉴들) 
 * 여기에 없는 /profile이나 /mypage는 무조건 로그인으로 튕깁니다!
 */
const PUBLIC_EXACT = new Set([
  "/", 
  "/login", 
  "/ads.txt",
  "/news",       // 👈 뉴스 1depth 열림
  "/briefing",   // 👈 브리핑 1depth 열림 (단, /briefing/123 은 튕김)
  "/assets",     // 👈 자산 1depth 열림
  "/community",  // 👈 커뮤니티 1depth 열림
])

/** * 💡 2. 이 경로로 시작하면 하위 경로까지 전부 통과 (시스템/인증/공지사항) 
 */
const PUBLIC_PREFIXES = [
  "/auth",    // /auth/callback 등 카카오/구글 로그인 처리용
  "/api",     // API는 내부에서 따로 검사하므로 일단 통과
  "/notice",  // 👈 공지사항은 상세페이지(/notice/123)까지 100% 개방!
]

function isPublicPath(pathname: string): boolean {
  // 정확히 일치하거나 (1depth)
  if (PUBLIC_EXACT.has(pathname)) return true
  // 특정 접두사로 시작하면 통과
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 비로그인 허용 경로면 세션 검사 없이 즉시 하이패스!
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request })
  }

  // 2. 허용되지 않은 경로(2depth, /profile 등)는 로그인 검사 시작
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const { data: { user } } = await supabase.auth.getUser()
    // 로그인이 되어 있다면 2depth든 profile이든 무사 통과!
    if (user) return response 
  } catch {
    return response
  }

  // 🚨 3. 로그인이 안 되어 있는데 2depth나 /profile을 누른 경우 -> 로그인 페이지로 강제 연행!
  // (로그인 완료 후 원래 보려던 페이지로 돌려보내기 위해 ?next= 주소를 달아줍니다)
  return NextResponse.redirect(new URL(`/login?next=${pathname}`, request.url))
}

export const config = {
  matcher: [
    "/((?!_next/|ads\\.txt|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}