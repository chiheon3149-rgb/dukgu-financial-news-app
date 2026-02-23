import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// =============================================================================
// 🔌 Supabase 서버 클라이언트 (Route Handler / Server Action용)
//
// createBrowserClient와 달리 쿠키를 next/headers에서 직접 읽어
// 서버사이드에서도 로그인된 세션을 그대로 사용할 수 있습니다.
// =============================================================================

export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Route Handler에서 쿠키 쓰기는 무시해도 무방
          }
        },
      },
    }
  )
}
