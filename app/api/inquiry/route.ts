import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { Resend } from "resend"

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

    // 관리자 이메일 알림 (실패해도 문의 접수 자체는 성공 처리)
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const categoryLabel: Record<string, string> = {
        bug: "🐛 버그/오류 신고", feature: "💡 기능 제안",
        account: "🔐 계정 문의", data: "📊 데이터 오류", other: "📝 기타",
      }
      resend.emails.send({
        from: "덕구의 뉴스곳간 <noreply@dukgu.kr>",
        to: adminEmail,
        subject: `[덕구 문의] ${categoryLabel[record.category] ?? record.category} — ${record.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
            <h2 style="font-size: 20px; font-weight: 900; margin-bottom: 4px;">📬 새 문의가 접수되었습니다</h2>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; color: #64748b; width: 80px; font-weight: bold;">유형</td>
                <td style="padding: 10px 8px; font-weight: bold;">${categoryLabel[record.category] ?? record.category}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; color: #64748b; font-weight: bold;">작성자</td>
                <td style="padding: 10px 8px;">${record.user_nickname ?? "익명"} (${record.user_email ?? "-"})</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; color: #64748b; font-weight: bold;">제목</td>
                <td style="padding: 10px 8px; font-weight: bold;">${record.title}</td>
              </tr>
            </table>

            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; color: #334155;">
${record.body}
            </div>

            <div style="margin-top: 24px; text-align: center;">
              <a href="https://dukgu.kr/mypage/inquiry" style="display: inline-block; background: #10b981; color: white; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: 900; text-decoration: none;">
                관리자 센터에서 답변하기 →
              </a>
            </div>

            <p style="margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center;">덕구의 뉴스곳간 자동발송 메일입니다.</p>
          </div>
        `,
      }).catch((e) => console.error("[inquiry] 이메일 발송 실패:", e))
    }

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
