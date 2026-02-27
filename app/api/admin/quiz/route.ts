import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 })

    // 💡 보안: profiles 테이블에서 진짜 관리자인지 확인
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "관리자 전용 기능입니다." }, { status: 403 })
    }

    const { weekLabel, quizList } = await req.json()

    // 💡 기획 포인트: 4문제를 한 번에 밀어 넣습니다.
    const records = quizList.map((q: any) => ({
      week_label: weekLabel,
      question: q.question,
      options: q.options,
      answer_index: q.answerIndex,
      explanation: q.explanation
    }))

    const { error } = await supabase.from("quizzes").insert(records)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "등록 실패" }, { status: 500 })
  }
}