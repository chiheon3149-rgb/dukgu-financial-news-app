import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { weekLabel, answers } = await req.json() // answers: [0, 2, 1, 3] 유저가 선택한 답

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 })

    // 1. 정답지 가져오기
    const { data: correctAnswers } = await supabase
      .from("quizzes")
      .select("answer_index")
      .eq("week_label", weekLabel)
      .order("id", { ascending: true })

    // 2. 채점 로직
    let score = 0
    correctAnswers?.forEach((q, idx) => {
      if (q.answer_index === answers[idx]) score++
    })

    // 3. 💡 기획자님의 핵심 로직: 올클리어 시 10XP, 아니면 0XP (또는 기본 점수)
    const xpEarned = (score === 4) ? 10 : 0 

    // 4. 결과 저장 (quiz_results 테이블에 저장)
    const { error: resError } = await supabase
      .from("quiz_results")
      .insert({
        user_id: user.id,
        week_label: weekLabel,
        score: score,
        xp_earned: xpEarned
      })

    if (resError) throw resError

    // 5. profiles 테이블의 유저 경험치(exp)도 업데이트해줘야겠죠?
    if (xpEarned > 0) {
      await supabase.rpc('increment_user_xp', { x: xpEarned, u_id: user.id })
    }

    return NextResponse.json({ score, xpEarned })
  } catch (err) {
    return NextResponse.json({ error: "제출 실패" }, { status: 500 })
  }
}