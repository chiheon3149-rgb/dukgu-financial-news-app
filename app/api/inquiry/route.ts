import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

// =============================================================================
// 📬 /api/inquiry
//
// POST: 문의 접수 → Supabase inquiries 테이블에 저장
// GET:  현재 로그인한 유저의 문의 목록 조회
// =============================================================================

interface InquiryPayload {
  category: string
  title: string
  body: string
  userNickname?: string
}

export async function POST(req: NextRequest) {
  try {
    const payload: InquiryPayload = await req.json()

    if (!payload.title?.trim() || !payload.body?.trim()) {
      return NextResponse.json({ error: "제목과 내용을 모두 입력해 주세요." }, { status: 400 })
    }
    if (payload.body.length > 2000) {
      return NextResponse.json({ error: "내용은 2000자 이내로 작성해 주세요." }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const record = {
      id: `inq-${Date.now()}`,
      category: payload.category,
      title: payload.title.trim(),
      body: payload.body.trim(),
      user_nickname: payload.userNickname ?? null,
      user_email: user.email ?? null,
      status: "pending",
      submitted_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("inquiries").insert(record)
    if (error) throw error

    console.log(`[inquiry] 접수 완료: ${record.id} (${record.category})`)

    return NextResponse.json({ success: true, id: record.id })
  } catch (err) {
    console.error("[inquiry] POST 오류:", err)
    return NextResponse.json(
      { error: "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("inquiries")
      .select("id, category, title, body, status, reply, submitted_at")
      .eq("user_email", user.email)
      .order("submitted_at", { ascending: false })

    if (error) throw error

    // snake_case → camelCase 변환
    const inquiries = (data ?? []).map((row: any) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      body: row.body,
      status: row.status,
      reply: row.reply ?? undefined,
      submittedAt: row.submitted_at,
    }))

    return NextResponse.json({ inquiries })
  } catch (err) {
    console.error("[inquiry] GET 오류:", err)
    return NextResponse.json(
      { error: "문의 목록 조회에 실패했습니다." },
      { status: 500 }
    )
  }
}
