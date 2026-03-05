import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🛡️ proxy.ts — 고속 패스 버전 (인증만 확인, DB 조회 제거)
// =============================================================================

/** 💡 1. 로그인 없이도 들어갈 수 있는 '공공장소' 목록 (정확히 일치해야 통과) */
const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/ads.txt",
  "/sitemap.xml",
  "/robots.txt",
  "/assets",
  "/onboarding", // 온보딩은 입국 심사대이므로 열어둡니다.
])

/** 💡 2. 이 단어로 시작하는 모든 경로는 무조건 프리패스! (여기에 rss 추가) */
const PUBLIC_PREFIXES = [
  "/auth",      // 인증 관련 API
  "/api",       // 각종 데이터 API
  "/notice",    // 공지사항
  "/news",      // 뉴스 목록/상세
  "/briefing",  // 브리핑 데이터
  "/community", // 커뮤니티 목록/상세
  "/rss",       // 👈 구글 애드센스 크롤러용 RSS 피드 추가!
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // Supabase 서버 클라이언트 생성 (쿠키 핸들링 포함)
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

  /**
   * 💡 3. 미들웨어에서는 auth.getUser()만 호출하여 '로그인 여부'만 판단합니다.
   */
  const { data: { user } } = await supabase.auth.getUser()

  // Case A: 비로그인 유저가 비공개 경로(마이페이지, 자산관리 등)에 접근할 때
  if (!user && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL(`/login?next=${pathname}`, request.url))
  }

  // Case B: 이미 로그인했거나, 공공장소에 접근하는 경우 하이패스!
  return response
}

export const config = {
  matcher: [
    /*
     * 💡 4. 아예 미들웨어 경비원이 쳐다보지도 않게 만들 예외 목록
     * 여기에 rss와 sitemap.xml 등을 명확하게 추가해서 원천 차단합니다.
     */
    "/((?!_next/static|_next/image|favicon.ico|ads\\.txt|robots\\.txt|sitemap\\.xml|rss|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}