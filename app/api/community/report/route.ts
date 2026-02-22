import { NextResponse } from "next/server"
import type { CommentReport, CommentReportReason } from "@/types"

// =============================================================================
// 🚨 POST /api/community/report
//
// 댓글 신고를 접수합니다.
// 현재: 서버 콘솔에 로그 출력
// 운영 시: 관리자 이메일 발송 (nodemailer 주석 해제)
//         오픈클로 봇이 이 이메일함을 모니터링하다가 정책 위반 시
//         해당 댓글의 isRemovedByAdmin을 true로 업데이트합니다.
// =============================================================================

const REASON_LABELS: Record<CommentReportReason, string> = {
  spam: "스팸/도배",
  hate: "혐오 발언",
  sexual: "음란/성적 콘텐츠",
  violence: "폭력/위협",
  misinformation: "허위 정보",
  other: "기타",
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CommentReport

    // 유효성 검사
    if (!body.commentId || !body.postId || !body.reason) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 })
    }

    // ── 서버 로그 (오픈클로 봇이 모니터링) ──
    console.log("🚨 [REPORT] 댓글 신고 접수")
    console.log("  postId   :", body.postId)
    console.log("  commentId:", body.commentId)
    console.log("  reason   :", REASON_LABELS[body.reason])
    if (body.detail) console.log("  detail   :", body.detail)
    console.log("  at       :", body.reportedAt)

    // ── Supabase 저장 (연결 시 주석 해제) ──
    // const { error } = await supabase.from("comment_reports").insert(body)
    // if (error) throw error

    // ── 이메일 발송 (nodemailer 설치 후 주석 해제) ──
    // npm install nodemailer @types/nodemailer
    // .env.local: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REPORT_TO_EMAIL
    //
    // const transporter = nodemailer.createTransport({ ... })
    // await transporter.sendMail({
    //   from: process.env.SMTP_USER,
    //   to: process.env.REPORT_TO_EMAIL,
    //   subject: `[DUKGU 신고] ${REASON_LABELS[body.reason]}`,
    //   text: `
    //     댓글 신고가 접수되었습니다.
    //     게시글 ID: ${body.postId}
    //     댓글 ID:   ${body.commentId}
    //     신고 사유: ${REASON_LABELS[body.reason]}
    //     상세 내용: ${body.detail ?? "없음"}
    //     신고 시각: ${body.reportedAt}
    //   `,
    // })

    return NextResponse.json({ success: true, message: "신고가 접수되었습니다." })
  } catch (error) {
    console.error("[REPORT ERROR]", error)
    return NextResponse.json({ error: "신고 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
