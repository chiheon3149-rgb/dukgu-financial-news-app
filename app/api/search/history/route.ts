import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

// =============================================================================
// 📡 /api/search/history
//
// 로그인 사용자의 검색 히스토리를 Supabase DB로 관리합니다.
// 최대 10개 유지, 초과 시 오래된 항목 자동 삭제.
//
// GET    → 히스토리 목록 조회
// POST   → 검색 추가 (ticker, name)
// DELETE → ?ticker=XXX 특정 삭제 / 파라미터 없으면 전체 삭제
// =============================================================================

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ history: [] })

  const { data } = await supabase
    .from("search_history")
    .select("ticker, name, searched_at")
    .eq("user_id", user.id)
    .order("searched_at", { ascending: false })
    .limit(10)

  return NextResponse.json({ history: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ticker, name } = await req.json()
  if (!ticker || !name) return NextResponse.json({ error: "ticker, name 필수" }, { status: 400 })

  // upsert: 이미 있으면 searched_at만 갱신
  await supabase
    .from("search_history")
    .upsert(
      { user_id: user.id, ticker, name, searched_at: new Date().toISOString() },
      { onConflict: "user_id,ticker" }
    )

  // 10개 초과 시 가장 오래된 항목 삭제
  const { data: all } = await supabase
    .from("search_history")
    .select("id")
    .eq("user_id", user.id)
    .order("searched_at", { ascending: false })

  if (all && all.length > 10) {
    const toDelete = all.slice(10).map((r) => r.id)
    await supabase.from("search_history").delete().in("id", toDelete)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ticker = new URL(req.url).searchParams.get("ticker")

  if (ticker) {
    await supabase
      .from("search_history")
      .delete()
      .eq("user_id", user.id)
      .eq("ticker", ticker)
  } else {
    await supabase
      .from("search_history")
      .delete()
      .eq("user_id", user.id)
  }

  return NextResponse.json({ ok: true })
}
