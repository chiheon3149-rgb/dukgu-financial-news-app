import { createClient } from "@supabase/supabase-js"

// =============================================================================
// 🔌 Supabase 클라이언트
//
// 앱 전체에서 이 파일 하나만 import해서 사용합니다.
// .env.local 의 값을 자동으로 읽어옵니다.
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
