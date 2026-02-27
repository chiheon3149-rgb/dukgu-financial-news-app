import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 })

    // 💡 [수리 포인트] profiles 테이블을 조회해서 이 유저가 관리자(is_admin)인지 확인!
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("submitted_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ inquiries: data })
  } catch (err) {
    return NextResponse.json({ error: "불러오기 실패" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 })

    // 💡 [수리 포인트] 답변을 달 때도 이 사람이 진짜 관리자인지 이중 체크!
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 })
    }

    const payload = await req.json()
    if (!payload.id || !payload.reply) {
      return NextResponse.json({ error: "데이터가 부족합니다." }, { status: 400 })
    }

    const { error } = await supabase
      .from("inquiries")
      .update({ reply: payload.reply, status: "resolved" })
      .eq("id", payload.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "답변 등록 실패" }, { status: 500 })
  }
}