import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"

// service role 클라이언트 — RLS 완전 우회
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function verifyAdmin() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!data?.is_admin) return null
  return user
}

// PUT: 브리핑 저장/수정 (upsert)
export async function PUT(req: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: "관리자 전용 기능입니다." }, { status: 403 })

    const body = await req.json()
    const { data, error } = await createServiceClient()
      .from("briefings")
      .upsert(body, { onConflict: "date,type" })
      .select("id")
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("briefing upsert error:", err)
    return NextResponse.json({ error: err.message || "저장 실패" }, { status: 500 })
  }
}

// PATCH: 브리핑 soft-delete / 내용 비우기
export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: "관리자 전용 기능입니다." }, { status: 403 })

    const { date, type, ...updates } = await req.json()
    if (!date || !type) return NextResponse.json({ error: "date, type 필요" }, { status: 400 })

    const { error } = await createServiceClient()
      .from("briefings")
      .update(updates)
      .eq("date", date)
      .eq("type", type)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("briefing patch error:", err)
    return NextResponse.json({ error: err.message || "수정 실패" }, { status: 500 })
  }
}
