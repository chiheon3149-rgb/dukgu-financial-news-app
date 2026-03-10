import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

// 관리자 확인 헬퍼
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServer>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!data?.is_admin) return null
  return user
}

// POST: 투표 질문 등록
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const user = await verifyAdmin(supabase)
    if (!user) return NextResponse.json({ error: "관리자 전용 기능입니다." }, { status: 403 })

    const { question, active_date } = await req.json()
    if (!question?.trim() || !active_date) {
      return NextResponse.json({ error: "질문과 날짜를 입력해주세요." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("vote_questions")
      .insert({ question: question.trim(), active_date, o_count: 0, x_count: 0 })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "해당 날짜에 이미 투표가 등록되어 있습니다." }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "등록 실패" }, { status: 500 })
  }
}

// DELETE: 투표 질문 삭제
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const user = await verifyAdmin(supabase)
    if (!user) return NextResponse.json({ error: "관리자 전용 기능입니다." }, { status: 403 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 })

    const { error } = await supabase.from("vote_questions").delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
}
