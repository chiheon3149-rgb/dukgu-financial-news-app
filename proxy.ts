import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🛡️ proxy.ts — 접근 제어 (뉴스/브리핑/공지사항 하위 경로까지 완전 개방)
// =============================================================================

/** * 💡 1. '정확히' 이 주소일 때만 비로그인 통과 (1depth 전용) 
 * 상세 페이지가 없는 단순 메뉴들 위주로 구성합니다.
 */
const PUBLIC_EXACT = new Set([
  "/", 
  "/login", 
  "/ads.txt",
  "/assets",    // 자산 메인 (상세 정보는 로그인이 필요할 수 있음)
  "/community", // 커뮤니티 목록 (게시글 상세는 보안을 유지하고 싶을 때 여기 둡니다)
])

/** * 💡 2. 이 경로로 시작하면 하위 경로까지 전부 통과 (하이패스 구역) 
 * 기획자님의 요청대로 초기 유입을 위해 뉴스/브리핑 상세페이지까지 완전히 엽니다!
 */
const PUBLIC_PREFIXES = [
  "/auth",     // 카카오/구글 로그인 처리용
  "/api",      // 내부 API 통신용
  "/notice",   // 공지사항 상세까지 개방
  "/news",     // 👈 [추가] 이제 /news/123 등 모든 뉴스 상세페이지가 열립니다!
  "/briefing", // 👈 [추가] 이제 /briefing/2026-02-26 등 모든 브리핑 로그가 열립니다!
]

function isPublicPath(pathname: string): boolean {
  // 1. 정확히 일치하는 경로인가?
  if (PUBLIC_EXACT.has(pathname)) return true
  // 2. 허용된 단어로 시작하는 하위 경로인가?
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 비로그인 허용 경로면 즉시 통과 (하이패스)
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request })
  }

  // 2. 그 외 경로(프로필, 마이페이지 등)는 로그인 검사 시작
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
    // 로그인이 되어 있다면 어디든 무사 통과!
    if (user) return response 
  } catch {
    return response
  }

  // 🚨 3. 로그인이 안 된 상태로 보안 구역을 누른 경우 -> 로그인으로 안내
  return NextResponse.redirect(new URL(`/login?next=${pathname}`, request.url))
}

export const config = {
  matcher: [
    "/((?!_next/|ads\\.txt|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}