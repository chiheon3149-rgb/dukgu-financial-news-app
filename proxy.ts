import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🛡️ proxy.ts — 접근 제어 (Next.js 16 proxy 컨벤션)
//
// 로그인 없이 접근 가능한 공개 경로를 화이트리스트로 관리합니다.
// 비로그인 사용자가 비공개 경로에 접근하면 /login으로 리다이렉트합니다.
// =============================================================================

/** 정확히 일치해야 하는 공개 경로 */
const PUBLIC_EXACT = new Set(["/", "/login"])

/** 이 경로로 시작하면 공개 (하위 경로 포함) */
const PUBLIC_PREFIXES = [
  "/auth",    // /auth/callback 등 OAuth 콜백
  "/news",    // /news/[id] 뉴스 상세
  "/notice",  // /notice, /notice/[id] 공지사항
  "/api",     // API 라우트는 자체적으로 인증 처리
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로는 세션 확인 없이 즉시 통과
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

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
    if (user) return response
  } catch {
    return response
  }

  // 비로그인 + 비공개 경로 → /login 리다이렉트
  return NextResponse.redirect(new URL("/login", request.url))
}

export const config = {
  matcher: [
    // _next/ 전체(정적파일·RSC데이터 요청 포함) 및 정적 에셋 제외
    "/((?!_next/|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}
