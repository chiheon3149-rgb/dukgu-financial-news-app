import { createBrowserClient } from "@supabase/ssr"

// =============================================================================
// 🔌 Supabase 클라이언트 (브라우저용)
//
// createBrowserClient: 세션을 localStorage가 아닌 쿠키에 저장합니다.
// 미들웨어(서버)와 동일한 쿠키를 공유하므로 SSR 세션 유지가 됩니다.
// 앱 전체에서 이 파일 하나만 import해서 사용합니다.
// =============================================================================

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
