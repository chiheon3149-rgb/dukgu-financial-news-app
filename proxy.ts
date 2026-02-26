import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 🛡️ proxy.ts — 수정된 접근 제어 (닉네임 미설정 유저 차단 로직 포함)
// =============================================================================

/** * 💡 1. '정확히' 이 주소일 때만 비로그인 통과 */
const PUBLIC_EXACT = new Set([
  "/", 
  "/login", 
  "/ads.txt",
  "/assets",
  "/onboarding", // 👈 [추가] 온보딩 페이지는 당연히 열려 있어야 합니다!
])

const PUBLIC_PREFIXES = [
  "/auth",     
  "/api",      
  "/notice",   
  "/news",     
  "/briefing", 
  "/community", 
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 비로그인 허용 경로면 일단 하이패스!
  // (단, 로그인 유저가 닉네임이 없는 경우는 아래 2번에서 따로 잡습니다.)
  if (isPublicPath(pathname) && pathname === "/login") {
     return NextResponse.next({ request })
  }

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
    
    // 💡 2. 로그인된 유저라면 '닉네임'이 있는지 추가 검문합니다.
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single()

      // 🚨 로그인은 했으나 닉네임이 없고, 현재 페이지가 온보딩이 아니라면?
      // -> 온보딩 페이지로 강제 압송!
      if (!profile?.nickname && pathname !== "/onboarding" && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL("/onboarding", request.url))
      }

      // 닉네임이 있다면 가려던 길 가게 해줍니다.
      return response 
    }
  } catch (error) {
    return response
  }

  // 3. 비로그인 유저가 공공장소가 아닌 곳(프로필 등)에 가려고 하면 로그인으로 보냄
  if (!isPublicPath(pathname)) {
    return NextResponse.redirect(new URL(`/login?next=${pathname}`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/|ads\\.txt|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}