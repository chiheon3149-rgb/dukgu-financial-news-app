import { NextRequest, NextResponse } from "next/server"

// =============================================================================
// 📬 POST /api/inquiry
//
// 역할: 유저가 작성한 문의를 받아서 두 가지 처리를 합니다.
//   1. 서버 콘솔 로그 (맥미니 터미널에서 바로 확인 가능)
//   2. Supabase inquiries 테이블에 저장 (향후 연결)
//   3. 이메일 발송 (향후 연결 — 아래 주석 참고)
//
// 이메일 발송 연결 방법:
//   npm install nodemailer @types/nodemailer
//   .env.local 에 SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, INQUIRY_TO_EMAIL 추가
//   아래 sendEmail 함수의 주석을 해제하면 됩니다.
// =============================================================================

interface InquiryPayload {
  category: string
  title: string
  body: string
  userNickname?: string
  userEmail?: string
}

// 이메일 발송 함수 — Nodemailer 연결 시 이 주석을 해제하세요
// async function sendEmail(payload: InquiryPayload) {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT ?? 587),
//     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
//   })
//   await transporter.sendMail({
//     from: `"DUKGU 문의" <${process.env.SMTP_USER}>`,
//     to: process.env.INQUIRY_TO_EMAIL,
//     subject: `[${payload.category}] ${payload.title}`,
//     text: `작성자: ${payload.userNickname ?? "익명"} (${payload.userEmail ?? "-"})\n\n${payload.body}`,
//   })
// }

export async function POST(req: NextRequest) {
  try {
    const payload: InquiryPayload = await req.json()

    // 유효성 검사
    if (!payload.title?.trim() || !payload.body?.trim()) {
      return NextResponse.json(
        { error: "제목과 내용을 모두 입력해 주세요." },
        { status: 400 }
      )
    }
    if (payload.body.length > 2000) {
      return NextResponse.json(
        { error: "내용은 2000자 이내로 작성해 주세요." },
        { status: 400 }
      )
    }

    const record = {
      id: `inq-${Date.now()}`,
      ...payload,
      status: "pending",
      submittedAt: new Date().toISOString(),
    }

    // 1. 맥미니 터미널 로그 (즉시 확인 가능)
    console.log("\n========== 📬 새 문의 도착 ==========")
    console.log(JSON.stringify(record, null, 2))
    console.log("====================================\n")

    // 2. 🔄 Supabase 저장 (연결 시 이 주석을 해제하세요)
    // const { error } = await supabase.from("inquiries").insert(record)
    // if (error) throw error

    // 3. 🔄 이메일 발송 (연결 시 이 주석을 해제하세요)
    // await sendEmail(payload)

    return NextResponse.json({ success: true, id: record.id })
  } catch (err) {
    console.error("[inquiry] 오류:", err)
    return NextResponse.json(
      { error: "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    )
  }
}

// 운영자가 문의 목록을 조회하는 엔드포인트 (향후 관리자 페이지에서 사용)
export async function GET() {
  // 🔄 Supabase 연결 시: supabase.from('inquiries').select('*').order('submitted_at', { ascending: false })
  return NextResponse.json({ message: "Supabase 연결 후 사용 가능합니다." })
}
