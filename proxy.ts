import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🛡️ proxy.ts — 접근 제어 (뉴스/브리핑/커뮤니티 상세페이지까지 100% 개방)
// =============================================================================

/** * 💡 1. '정확히' 이 주소일 때만 비로그인 통과 (1depth 전용) 
 * 상세 페이지가 없는 단순 메뉴들이나 시스템 파일 위주입니다.
 */
const PUBLIC_EXACT = new Set([
  "/", 
  "/login", 
  "/ads.txt",
  "/assets",    // 자산 메인 (내 돈 관리는 로그인이 필요하니까요!)
])

/** * 💡 2. 이 경로로 시작하면 하위 경로까지 전부 통과 (하이패스 구역) 
 * 기획자님의 '유입 극대화' 전략에 따라 주요 콘텐츠 상세페이지를 모두 개방합니다.
 */
const PUBLIC_PREFIXES = [
  "/auth",      // 카카오/구글 로그인 처리용
  "/api",       // 내부 데이터 통신용
  "/notice",    // 공지사항 상세
  "/news",      // 👈 뉴스 상세페이지 (/news/123) 개방
  "/briefing",  // 👈 브리핑 상세페이지 (/briefing/2026-02-26) 개방
  "/community", // 👈 [추가] 이제 커뮤니티 게시글 상세 (/community/456) 개방!
]

function isPublicPath(pathname: string): boolean {
  // 1. 정확히 일치하는 경로인가?
  if (PUBLIC_EXACT.has(pathname)) return true
  // 2. 허용된 단어로 시작하는 하위 경로인가?
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 비로그인 허용 경로면 즉시 통과 (검문 통과!)
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request })
  }

  // 2. 그 외 보안 구역(프로필, 설정, 글쓰기 등)은 로그인 검사 시작
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
    // 세션 정보를 가져와 실제 유저인지 확인합니다.
    const { data: { user } } = await supabase.auth.getUser()
    
    // 로그인이 되어 있다면 보안 구역도 무사 통과!
    if (user) return response 
  } catch (error) {
    // 에러 발생 시 안전하게 응답 반환
    return response
  }

  // 🚨 3. 로그인이 안 된 상태로 보안 구역(Profile 등)을 누른 경우 -> 로그인으로 안내
  // 나중에 로그인 후 다시 이 페이지로 돌아오도록 ?next= 주소를 붙여줍니다.
  return NextResponse.redirect(new URL(`/login?next=${pathname}`, request.url))
}

export const config = {
  matcher: [
    "/((?!_next/|ads\\.txt|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}