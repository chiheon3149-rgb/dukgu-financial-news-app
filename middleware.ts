import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🛡️ proxy.ts — 고속 패스 버전 (인증만 확인, DB 조회 제거)
// =============================================================================

/** 💡 1. 로그인 없이도 들어갈 수 있는 '공공장소' 목록 */
const PUBLIC_EXACT = new Set([
  "/", 
  "/login", 
  "/ads.txt",
  "/assets",
  "/onboarding", // 온보딩은 입국 심사대이므로 열어둡니다.
])

const PUBLIC_PREFIXES = [
  "/auth",      // 인증 관련 API
  "/api",       // 각종 데이터 API
  "/notice",    // 공지사항
  "/news",      // 뉴스 목록/상세
  "/briefing",  // 브리핑 데이터
  "/community", // 커뮤니티 목록/상세
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
   * 💡 핵심 로직 수정
   * 1. 미들웨어에서는 auth.getUser()만 호출하여 '로그인 여부'만 판단합니다.
   * 2. profiles 테이블 조회(DB I/O)를 제거하여 페이지 로딩 속도를 극대화합니다.
   */
  const { data: { user } } = await supabase.auth.getUser()

  // Case A: 비로그인 유저가 비공개 경로(마이페이지, 자산관리 등)에 접근할 때
  if (!user && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL(`/login?next=${pathname}`, request.url))
  }

  // Case B: 이미 로그인했거나, 공공장소에 접근하는 경우 하이패스!
  // (닉네임 체크는 Client-side의 UserContext에서 처리하여 무한 루프를 방지합니다.)
  return response
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 경로에서 미들웨어 실행:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, ads.txt 등 루트 정적 파일
     * - 이미지, 폰트 등 확장자 파일
     */
    "/((?!_next/static|_next/image|favicon.ico|ads\\.txt|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}