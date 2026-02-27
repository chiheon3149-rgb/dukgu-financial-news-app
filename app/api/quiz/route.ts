import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    
    // 💡 기획 포인트: 가장 최근에 등록된 '주차(week_label)'의 문제 4개를 가져옵니다.
    const { data: latestQuiz } = await supabase
      .from("quizzes")
      .select("week_label")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!latestQuiz) return NextResponse.json({ quizzes: [] })

    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("week_label", latestQuiz.week_label)
      .limit(4) // 무조건 4문제!

    if (error) throw error

    return NextResponse.json({ 
      weekLabel: latestQuiz.week_label,
      quizzes 
    })
  } catch (err) {
    return NextResponse.json({ error: "퀴즈 로딩 실패" }, { status: 500 })
  }
}